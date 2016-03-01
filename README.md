# entitizejs
A JavaScript library that helps turn domain models into rich JavaScript objects

<br />
<strong>Server</strong>
```C#
public class Foo
{
    public int FooId { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
    public List<Bar> Bars { get; set; }
}
```
<strong>Client</strong>
```javascript
// Serialize the object
var jsFoo = @Html.Raw(JsonConvert.SerializeObject(Model,
        new JsonSerializerSettings() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }));

// Define constructor for the object
Foo = function() {
    // these are required properties
    this.type = "Foo";
    this.updateUrl = "/FooBarBaz/UpdateFoo";
    this.mappings = [ {propType:"int", propName:"FooId"},
                      {propType:"string", propName:"Name"},
                      {propType:"int", propName:"Age"},
                      {propType:"Bar", propName:"Bars", nav:true, relationship:"one-to-many", childType:"Bar"} ];
    
    // Define a function for all instances of Foo
    this.fooFunc = function() {
        console.log(this);
    }
}
```
<strong>entitizejs</strong>
```javascript
// Initialize the constructor with Entitize
Entitize.initialize(Foo);

// Entitize the serialized object, passing its type
var jsEntityFoo = Entitize(jsFoo, "Foo");
console.log(jsEntityFoo2); //=> 

jsEntityFoo.fooFunc() //=> calls the function defined in Foo's constructor

jsEntityFoo.entitize() //=> returns the object prepared for the server (as defined in mappings)
jsEntityFoo.save() //=> calls entitize() on the object, and posts it to obj.updateUrl
```
