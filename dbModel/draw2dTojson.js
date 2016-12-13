example.jsonWriter = draw2d.io.Writer.extend({

  init: function()
  {
    this._super();
  },

  /**
   * @method
   * Export the content to the implemented data format. Inherit class implements
   * content specific writer.
   * <br>
   * <br>
   *
   * Method signature has been changed from version 2.10.1 to version 3.0.0.<br>
   * The parameter <b>resultCallback</b> is required and new. The method calls
   * the callback instead of return the result.
   *
   * @param {draw2d.Canvas} canvas
   * @param {Function} resultCallback the method to call on success. The first argument is the result object, the second the base64 representation of the file content
   * @param {Object} resultCallback.json  the canvas document as JSON object
   * @param {String} resultCallback.base64  the canvas document as base encoded JSON
   */
  marshal: function(canvas, resultCallback)
  {
    // I change the API signature from version 2.10.1 to 3.0.0. Throw an exception
    // if any application not care about this changes.
    if(typeof resultCallback !== "function"){
      throw "Writer.marshal method signature has been change from version 2.10.1 to version 3.0.0. Please consult the API documentation about this issue.";
    }

    var result = [], _this = this, fkList = {};

    // 遍历所有连线即外键，并处理
    canvas.getLines().each(function(i, element){
      var json = element.getPersistentAttributes(),
          nt = json.source,
          ft = json.target,
          ftable = canvas.getFigure(ft.node);

      !fkList[nt.node] && (fkList[nt.node]=[]);
      fkList[nt.node].push({
        'port': nt.port,
        'fk_table': ftable.getLabel(),
        'fk_port': ftable.getChildren().find(function(label){
          return "input_" + label.getId() == ft.port && label;
        })
      });
    });

    // 遍历所有table并处理
    canvas.getFigures().each(function(i, figure){
      var json = figure.getPersistentAttributes(),
          fkAll = fkList[json.id],
          field = _this.getFields(json.entities);

      result.push({
        'name': json.name,
        'char_set': 'utf-8',
        'fields': field.fields,
        'pk': field.pk,
        'fk': fkAll ? fkAll.map(function(item){
          return {
            'name': figure.getChildren().find(function(label){
              return "output_" + label.getId() == item.port && label;
            }).getText(),
            'foreign_table_name': item.fk_table.getText(),
            'foreign_field_name': item.fk_port.getText()
          }
        }) : []
      });

    });

    var base64Content = draw2d.util.Base64.encode(JSON.stringify(result, null, 2));

    resultCallback(result, base64Content);
  },
  /**
   * @method
   * 解析字段
   * @HM Array -> Object {fields, pk}
   */
  getFields: function(entities){
    var pk = '';
    return {
      fields: entities.map(function(item){
        !pk && item.pk && (pk = item.text);
        return {
          'name': item.text,
          'type': item.type || 'string',
          'null': item.null || false,
          'max_length': item.max_length || '',
          'auto_inc': item.auto_inc || false,
          'default': item.default
        }
      }),
      pk: pk
    }
  }
});

/**
 * @method
 * 将后端数据转换为draw2d的结构
 * @HM Array -> Array
 */
function jsonToDraw2d(json){

  var table = (function(_json){
    /**
     * @method
     * 字段转换为draw2d的结构
     * @HM Array -> Object {item, it}
     */
    var getEntities = function(item, pk){
      var itList = {},
          arr = item.map(function(entity){
            var uid = draw2d.util.UUID.create()
            itList[entity.name] = uid;
            return {
              "text": entity.name,
              "id": uid,
              "type": entity.type,
              "null": entity.null,
              "auto_inc": entity.auto_inc,
              "max_lenght": entity.max_length,
              "default": entity.default,
              "pk": pk == entity.name ? true : false
            }
          });

      return {
        item: arr,
        it: itList
      }
    };

    // x、y轴处理依赖的状态
    var sx = 140, ix = 50, x = ix,
        sy = 140, y = 50,
        num = 0, level = 1, step = 5;

    var tb = {}, fk = [],
        arr = _json.map(function(item){
          var uid = draw2d.util.UUID.create(),
              fields = getEntities(item.fields, item.pk),
              obj = {
                "type": 'TableShape',
                "id": uid,
                "x": x,
                "y": y,
                "cssClass": "TableShape",
                "bgColor": "#DBDDDE",
                "color": "#D7D7D7",
                "stroke": 1,
                "alpha": 1,
                "radius": 3,
                "name": item.name,
                "entities": fields.item
              };

          // 有外键时为添加对应状态
          toString.apply(item.fk) == '[object Array]'
            && item.fk.length > 0
            && fk.push({ name: item.name, fk: item.fk });

          // 保存table对应draw2d的uid
          tb[item.name] = {
            uid: uid,
            fields: fields.it
          };

          // 改变显示的x、y轴
          num++, num % step == 0 ? (level++, x=ix, y=sy*level) : x+=sy

          return obj;
        });

    return {
      item: arr,
      fk: fk,
      tb: tb
    }
  })(json);

  var connection = (function(_table){
    return _table.fk.reduce(function(prev, item){
      var nTb = _table.tb[item.name],
          fk = item.fk.map(function(fk){
            var fTb = _table.tb[fk.foreign_table_name];
            return {
              "type": 'draw2d.Connection',
              "id": draw2d.util.UUID.create(),
              "cssClass": 'draw2d.Connection',
              "stroke": 2,
              "color": "#4caf50",
              "outlineStroke": 1,
              "outlineColor": "#ffffff",
              "policy": "draw2d.policy.line.LineSelectionFeedbackPolicy",
              "router": "draw2d.layout.connection.InteractiveManhattanConnectionRouter",
              "radius": 2,
              source: {
                node: nTb.uid,
                port: "output_" + nTb.fields[fk.name]
              },
              target: {
                node: fTb.uid,
                port: "input_" + fTb.fields[fk.foreign_field_name]
              }
            }
          });

      // 合并数组
      return prev.concat(fk);
    }, []);
  })(table);

  // 合并数组（将TableShape和Connection合并在一起）
  return table.item.concat(connection);
}
