# entitizejs
A JavaScript library that helps turn domain models into rich JavaScript objects
<br />
<br />
the main function of the library is to map domain model objects from the server, to rich JavaScript objects on the client.
entitizejs provides an interface to easily define mappings for objects, and relationships between those objects if they exist.
by defining a custom constructor for your object, it is easy to initialize it with the Entitize framework by calling Entitize.initialize(constructor). This sets up the constructor function that is used for all objects of this constructors type.
easily persist them back to the server with only it's original props!
<br />
<br />
<strong>Server</strong>
```C#
/// <summary>
/// Domain model <c>Foo</c>.
/// </summary>
public class Foo
{
    public int FooId { get; set; }
    public string Name { get; set; }
    public int Age { get; set; }
    public List<Bar> Bars { get; set; }
}

/// <summary>
/// Controller action to update the <c>Foo</c> object.
/// </summary>
/// <param name="foo">The foo to update</param>
/// <returns>HttpStatusCode.OK</returns>
[HttpPost]
public ActionResult UpdateFoo(Foo foo)
{
    return new HttpStatusCodeResult(HttpStatusCode.OK);
}
```
<br />
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
    this.mappings = [{propType:"int", propName:"FooId"},
                     {propType:"string", propName:"Name"},
                     {propType:"int", propName:"Age"},
                     {propType:"Bar", propName:"Bars", nav:true, relationship:"one-to-many", childType:"Bar"}];
    
    // Define a function for all instances of Foo
    this.fooFunc = function() {
        console.log(this);
    }
}
```
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
