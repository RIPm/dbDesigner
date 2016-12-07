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
                    return "input_"+label.getId() == ft.port && label;
                })
            });
        });


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
                            return "output_"+label.getId() == item.port && label;
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
