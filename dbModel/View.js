example.View = draw2d.Canvas.extend({
  init:function(id)
  {
    this._super(id, 2000,2000);

    this.setScrollArea("#"+id);

    this.nameDom = $('#tName');
    this.typeDom = $('#tType');
    this.lengthDom = $('#tLength');
    this.defaultDom = $('#tDefault');
    this.canNullDom = $('#tCanNull');
    this.pkDom = $('#tPk');
    this.autoIncDom = $('#tAutoInc');

    this.on('select', function(emitter, event){
      event.figure &&  event.figure.NAME == 'TableShape' && event.figure.onSelection();
    })
  },

  /**
   * @method
   * Called if the user drop the droppedDomNode onto the canvas.<br>
   * <br>
   * Draw2D use the jQuery draggable/droppable lib. Please inspect
   * http://jqueryui.com/demos/droppable/ for further information.
   *
   * @param {HTMLElement} droppedDomNode The dropped DOM element.
   * @param {Number} x the x coordinate of the drop
   * @param {Number} y the y coordinate of the drop
   * @param {Boolean} shiftKey true if the shift key has been pressed during this event
   * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
   * @private
   **/
  onDrop : function(droppedDomNode, x, y, shiftKey, ctrlKey)
  {
    var type = $(droppedDomNode).data("shape");
    var figure = eval("new "+type+"();");

    // 设置拖动后的table内容
    this.v = !this.v ? 1 : this.v+1;
    figure
      .setName("NewTable_"+ this.v)
      .addEntity("id")
      .set('type', 'int')
      .set('null', false)
      .set('pk', true)
      .set('auto_inc', true);

    // create a command for the undo/redo support
    var command = new draw2d.command.CommandAdd(this, figure, x, y);
    this.getCommandStack().execute(command);
  }
});
