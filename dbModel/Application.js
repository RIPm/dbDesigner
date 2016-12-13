// declare the namespace for this example
var example = {};

/**
 *
 * The **GraphicalEditor** is responsible for layout and dialog handling.
 *
 * @author Andreas Herz
 * @extends draw2d.ui.parts.GraphicalEditor
 */
example.Application = Class.extend(
  {
    NAME : "example.Application",

    /**
     * @constructor
     *
     * @param {String} canvasId the id of the DOM element to use as paint container
     */
    init : function()
    {
      this.view    = new example.View("canvas");
      // 工具栏
      this.toolbar = new example.Toolbar("toolbar",  this.view );

      // 添加/修改字段时，可选的类型
      var type =
            ['varchar', 'int', 'char', 'date', 'datetime', 'text']
            .reduce(function(prev, item){
              return prev += '<option value="'+item+'">'+item+'</option>';
            }, '');

      this.view.typeDom.html(type);
    }


  });
