TableShape = draw2d.shape.layout.VerticalLayout.extend({

    NAME: "TableShape",

    init : function(attr)
    {
        var _this = this;
        this._super($.extend({bgColor:"#dbddde", color:"#d7d7d7", stroke:1, radius:3},attr));

        this.classLabel = new draw2d.shape.basic.Label({
            text:"ClassName",
            stroke:1,
            fontColor:"#5856d6",
            bgColor:"#f7f7f7",
            radius: this.getRadius(),
            padding:10,
            resizeable:true,
            editor:new draw2d.ui.LabelInplaceEditor({
                onCommit: function(){
                    // 更新数据显示
                    _this.onSelection();
                }
            })
        });

        this.add(this.classLabel);

    },
    getLabel: function(){
        return this.classLabel;
    },
    /**
     * @method
     * Add an entity to the db shape
     *
     * @param {String} txt the label to show
     * @param {Number} [optionalIndex] index where to insert the entity
     */
    addEntity: function(txt, optionalIndex)
    {
        var table = this;

        var label = new draw2d.shape.basic.Label({
            text:txt,
            stroke:1,
            color: '#bbbbbb',
            radius:0,
            bgColor: null,
            padding:{left:10, top:3, right:10, bottom:5},
            fontColor:"#4a4a4a",
            resizeable:true,
            editor: new TableEditor({
                onCommit: function(){
                    // 更新数据显示
                    table.onSelection();
                }
            }),
            onMouseEnter: function(){
                this.setBackgroundColor('#cdcdcd');
            },
            onMouseLeave: function(){
                this.setBackgroundColor(null);
            },
            get: function(name){
                return this[name];
            },
            set: function(name, val){
                this[name] = val;
                return this;
            },
            getAttr: function(){
                return {
                    text: this.getText(),
                    pk: this.pk,
                    type: this.type,
                    null: this.null,
                    max_length: this.max_length,
                    auto_inc: this.auto_inc,
                    default: this.default
                }
            }
        });

        //        label.installEditor(new draw2d.ui.LabelEditor());
        var input = label.createPort("input");
        var output= label.createPort("output");

        input.setName("input_"+label.id);
        output.setName("output_"+label.id);

        var _table=this;
        label.on("contextmenu", $.proxy(this.contextMenu, this));

        if($.isNumeric(optionalIndex)){
            this.add(label, null, optionalIndex+1);
        }
        else{
            this.add(label);
        }
        return label;
    },
    contextMenu: function(emitter, event){
        var _table = this;
        $.contextMenu({
            selector: 'body',
            events: {
                hide:function(){ $.contextMenu( 'destroy' ); }
            },
            callback: $.proxy(function(key, options){
                switch(key){
                case "modify":
                    setTimeout(function(){
                        emitter.onDoubleClick();
                    },10);
                    break;
                case "new":
                    setTimeout(function(){
                        _table.addEntity("_new_")
                            .set('type', 'varchar')
                            .onDoubleClick();
                    },10);
                    break;
                case "delete":
                    // with undo/redo support
                    var cmd = new draw2d.command.CommandDelete(emitter);
                    emitter.getCanvas().getCommandStack().execute(cmd);
                    _table.onSelection();
                default:
                    break;
                }

            },this),
            x: event.x,
            y: event.y,
            items: {
                "modify": {name: "Modify"},
                "new":    {name: "New Entity"},
                "sep1":   "---------",
                "delete": {name: "Delete"}
            }
        });
    },
    /**
     * @method
     * Remove the entity with the given index from the DB table shape.<br>
     * This method removes the entity without care of existing connections. Use
     * a draw2d.command.CommandDelete command if you want to delete the connections to this entity too
     *
     * @param {Number} index the index of the entity to remove
     */
    removeEntity: function(index)
    {
        this.remove(this.children.get(index+1).figure);
    },

    /**
     * @method
     * Returns the entity figure with the given index
     *
     * @param {Number} index the index of the entity to return
     */
    getEntity: function(index)
    {
        return this.children.get(index+1).figure;
    },
    /**
     * @method
     * Set the name of the DB table. Visually it is the header of the shape
     *
     * @param name
     */
    setName: function(name)
    {
        this.classLabel.setText(name);

        return this;
    },
    onSelection: function(){
        list = [];
        this.children.each(function(i,e){
            if(i>0){
                var figure = e.figure;
                list.push(figure.getAttr())
            }
        });
        $('#canvasInfo').html(this.classLabel.getText()+"表：<br><br>"+JSON.stringify(list, null, '<br>'));
        // console.log(JSON.stringify(list, null, '\t'));
    },

    /**
     * @method
     * Return an objects with all important attributes for XML or JSON serialization
     *
     * @returns {Object}
     */
    getPersistentAttributes : function()
    {
        var memento= this._super();

        memento.name = this.classLabel.getText();
        memento.entities   = [];
        this.children.each(function(i,e){
            if(i>0){ // skip the header of the figure
                var figure = e.figure;
                memento.entities.push({
                    text: figure.getText(),
                    id: figure.id,
                    pk: figure.pk,
                    type: figure.type,
                    null: figure.null,
                    max_length: figure.max_length,
                    auto_inc: figure.auto_inc,
                    default: figure.default
                });
            }
        });
        return memento;
    },

    /**
     * @method
     * Read all attributes from the serialized properties and transfer them into the shape.
     *
     * @param {Object} memento
     * @return
     */
    setPersistentAttributes : function(memento)
    {
        this._super(memento);
        this.setName(memento.name);
        if(typeof memento.entities !== "undefined"){
            $.each(memento.entities, $.proxy(function(i,e){
                var entity = this.addEntity(e.text)
                        .set('id', e.id)
                        .set('type', e.type)
                        .set('pk', e.pk)
                        .set('null', e.null)
                        .set('max_length', e.max_length)
                        .set('auto_inc', e.auto_inc)
                        .set('default', e.default);
                entity.getInputPort(0).setName("input_"+e.id);
                entity.getOutputPort(0).setName("output_"+e.id);
            },this));
        }
        return this;
    }

});
