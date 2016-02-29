/*The MIT License (MIT)

Copyright (c) 2016 Zachery Sogolow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
    EntitizeNamespace = {
        types: {},
        settings: {}
    };

    // pass the Entitize function a serialized object, and
    // the entityType as defined in the settings
    Entitize = function (jsObject, entitytype) {

        if (jsObject && entitytype) {
            var jEntity = new JEntity(jsObject, entitytype);
            return jEntity;
        }

        this.entitize = function () {
            // the accumulator 
            var objToSave = {};
            // the object mappings based on the entityType
            var mappings = EntitizeNamespace.settings[this.entityType];

            // loop through each property mapping, checking each one first
            // to see if there is a nav property defined for it 
            for (var prop in mappings) {
                var mapping = mappings[prop];
                // if nav = true, we need to recurse on the child 
                // object(s) by calling entitize() on them, storing 
                // the results as we go
                if (mapping.nav) {
                    // get the relationship
                    var relationship = mapping.relationship;
                    if (relationship === "one-to-many") {
                        // one to many relationship, the nav property must be of
                        // type array. copy the array into navChildren
                        var navChildren = this[mapping.propName];
                        // clear out property, store new objects here
                        objToSave[mapping.propName] = [];

                        // loop through each child object in the array
                        // of children, entitizing each one along the way
                        // and storing them in the objToSave array
                        for (var prop in navChildren) {
                            var obj = navChildren[prop].entitize();
                            objToSave[mapping.propName].push(obj);
                        }
                    } else if (relationship === "one-to-one") {
                        // the relationship is one to one, save the individual 
                        // object, if it exists
                        if (this[mapping.propName]) {
                            objToSave[mapping.propName] = this[mapping.propName].entitize();
                        } else {
                            // todo?? how to handle deletion of objects
                            objToSave[mapping.propName] = null;
                        }
                    }
                } else {
                    // there is no nav property defined, copy the value type to the
                    // object being returned
                    objToSave[mapping.propName] = this[mapping.propName];
                }
            }

            // finally, return the object we were accumulating
            return objToSave;
        }

        // todo, callback to server to save entity
        this.save = function () {
            var objToSend = this.entitize();

            var r = new XMLHttpRequest();
            r.open("POST", this.updateUrl, true);
            r.setRequestHeader('Content-Type', 'application/json');
            r.onreadystatechange = function () {
                if (r.readyState != 4 || r.status != 200) return;
                console.log(r.responseText);
            };

            r.send(JSON.stringify(objToSend));
        }
    }

    // initialize with constructors OR settings object
    Entitize.initialize = function (settings) {
        if (typeof (settings) === 'function') {
            var baseObj = new settings();
            baseObj.__proto__ = new Entitize();
            EntitizeNamespace.types[baseObj.type] = baseObj;
            EntitizeNamespace.settings[baseObj.type] = baseObj.mappings;
        } else {
            var types = {};
            for (var type in settings) {
                types[type] = new Entitize();
            }
            EntitizeNamespace.settings = settings;
            EntitizeNamespace.types = types;
        }
        return EntitizeNamespace;
    }

    // extends all of the properties and functions
    // from object => target if object.hasOwnProp
    Entitize.extend = function (target, object) {
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                target[prop] = object[prop];
            }
        }
    }

    // extends all of the properties and functions from
    // object => all objects that have been created or will be
    // created with the given entityType
    Entitize.extendType = function (entityType, object) {
        Entitize.extend(EntitizeNamespace.types[entityType], object);
    }

    // JEntity Base Constructor. Every object is a JEntity.
    // Configure the new object we are creating based on the 
    // mappings for that object
    JEntity = function (jsObject, entityType) {
        var mappings = EntitizeNamespace.settings[entityType];
        this.entityType = entityType;

        // first try to configure all of the mappings
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            // if there is a nav property for this object,
            // we need to create JEntity's for them as well
            if (mapping.nav) {
                var navProp = mapping.propName; // propName
                var relation = mapping.relationship; // nav relationship
                var childType = mapping.childType; // nav childType

                if (relation === "one-to-many") {
                    // one to many, we need to Entitize each object in the relation
                    var relationObjects = jsObject[navProp];
                    jsObject[navProp] = []; // we will be adding to jsObject[navProp]
                    for (var obj in relationObjects) {
                        var entitizeMe = relationObjects[obj];
                        var entitized = Entitize(entitizeMe, childType)
                        jsObject[navProp].push(entitized);
                    }
                } else if (relation === "one-to-one") {
                    // one to one relation, Entitize the object
                    var entitizeMe = jsObject[navProp];
                    var entitized = Entitize(entitizeMe, childType);
                    jsObject[navProp] = entitized;
                }
            }
        }

        // extend all of the properties in the jsObject, including the newly created
        // relation JEntity objects
        Entitize.extend(this, jsObject);

        // set the proto to the base object as all other types
        this.__proto__ = EntitizeNamespace.types[this.entityType];
    }

})();

/*  Usage: 

<script src="~/Scripts/entitize/entitize.js"></script>

<script>

    var jsTable = @Html.Raw(JsonConvert.SerializeObject(Model.Table,
         new JsonSerializerSettings() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }));

    var mappings = {
        Table : [ {propType:"int", propName:"ID"},
                    {propType:"string", propName:"RowVersion"},
                    {propType:"string", propName:"TableName"},
                    {propType:"Column", propName:"Columns", nav:true, relationship:"one-to-many", childType:"Column"},
                    {propType:"Column", propName:"SplitBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"Column", propName:"SortBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"Column", propName:"GroupBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"bool", propName:"SortOrder"}],

        Column: [{propType:"int", propName:"ID"},
                    {propType:"string", propName:"RowVersion"},
                    {propType:"string", propName:"QuestionId"},
                    {propType:"string", propName:"ColumnName"},
                    {propType:"Filter", propName:"Filter", nav:true, relationship:"one-to-one", childType:"Filter"},
                    {propType:"int", propName:"Position"},
                    {propType:"int", propName:"TableId"},
                    {propType:"Table", propName:"Table"}],

        Filter: [{propType:"int", propName:"ID"},
                    {propType:"string", propName:"RowVersion"},
                    {propType:"string", propName:"FilterQuery"}]};

    Entitize.initialize(mappings);

    // entitizer
    var tableEntity = Entitize(jsTable, "Table")
    console.log(tableEntity)


    //////////////////////////////////////////////////////////////////////////////////


    var jsTable2 = @Html.Raw(JsonConvert.SerializeObject(Model.Table,
         new JsonSerializerSettings() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }));

    TableConstructor = function() {
        this.type = "Table";
        this.updateUrl = "/Tables/UpdateTable";
        this.mappings = [ {propType:"int", propName:"ID"},
                    {propType:"string", propName:"RowVersion"},
                    {propType:"string", propName:"TableName"},
                    {propType:"Column", propName:"Columns", nav:true, relationship:"one-to-many", childType:"Column"},
                    {propType:"Column", propName:"SplitBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"Column", propName:"SortBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"Column", propName:"GroupBy", nav:true, relationship:"one-to-one", childType:"Column"},
                    {propType:"bool", propName:"SortOrder"}];

        this.tableFunc = function() {
            console.log(this);
        }
    }

    ColumnConstructor = function() {
        this.type = "Column";
        this.updateUrl = "/Tables/UpdateColumn";
        this.mappings = [{propType:"int", propName:"ID"},
                       {propType:"string", propName:"RowVersion"},
                       {propType:"string", propName:"QuestionId"},
                       {propType:"string", propName:"ColumnName"},
                       {propType:"Filter", propName:"Filter", nav:true, relationship:"one-to-one", childType:"Filter"},
                       {propType:"int", propName:"Position"},
                       {propType:"int", propName:"TableId"},
                       {propType:"Table", propName:"Table"}]

        this.columnFunc = function() {
            console.log(this);
        }
    }

    FilterConstructor = function() {
        this.type = "Filter";
        this.updateUrl = "/Tables/UpdateFilter";
        this.mappings = [{propType:"int", propName:"ID"},
                    {propType:"string", propName:"RowVersion"},
                    {propType:"string", propName:"FilterQuery"}];

        this.filterFunc = function() {
            console.log(this);
        }
    }

    Entitize.initialize(TableConstructor);
    Entitize.initialize(ColumnConstructor);
    Entitize.initialize(FilterConstructor);

    var moreTableFunctions = {
        tableFuncAnother : function() {
            console.log(this);
        },
        tableFuncAndAnother: function() {
            console.log(this);
        }
    }
    Entitize.extendType("Table", moreTableFunctions);

    // entitizer
    var tableEntity = Entitize(jsTable2, "Table")
    console.log(tableEntity)

</script>
*/
