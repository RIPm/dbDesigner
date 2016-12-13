/**
 * @Class
 * 自定义的label ui编辑器
 */
TableEditor = draw2d.ui.LabelEditor.extend({

  NAME: "TableEditor",

  init: function(listener){
    this._super();

    this.listener = $.extend({onCommit: function(){}, onCancel: function(){}}, listener);
  },

  start: function(label){
    this.label = label;

    var _this = this,
        view = this.label.getCanvas();

    /* 获取对应值并渲染到页面 */
    view.nameDom.val(this.label.get('text'));
    view.typeDom.val(this.label.get('type'));
    view.lengthDom.val(this.label.get('max_length'));
    view.defaultDom.val(this.label.get('default'));
    view.canNullDom.prop("checked", this.label.get('null') ? "true" : false);
    view.pkDom.prop('checked', this.label.get('pk') ? "true" : false);
    view.autoIncDom.prop('checked', this.label.get('auto_inc') ? "true" : false);

    $('#dialog').dialog({
      modal: true,
      buttons: {
        "取消": function(){
          // 触发取消的回调
          _this.listener.onCancel(_this.label);
          $('#dialog').dialog('close');
        },
        "确认": function(){
          /* 将视图对应值保存 */
          _this.label
            .set('text', view.nameDom.val())
            .set('pk', view.pkDom.is(':checked'))
            .set('null', view.canNullDom.is(':checked'))
            .set('auto_inc', view.autoIncDom.is(':checked'))
            .set('type', view.typeDom.val())
            .set('max_length', view.lengthDom.val())
            .set('default', view.defaultDom.val())

          // 触发完成后的回调
          _this.listener.onCommit(_this.label);

          $('#dialog').dialog('close');
        }
      }
    })

  }
})
