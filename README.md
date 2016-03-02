# entitizejs
A JavaScript library that helps turn domain models into rich JavaScript objects
<br />
<br />
The main function of the library is to map domain model objects from the server, to rich JavaScript objects on the client.
<b>entitizejs</b> provides an interface to easily define mappings for objects, and relationships between those objects if they exist.
By defining a custom constructor for your object, it is easy to initialize it with the Entitize framework by calling Entitize.initialize(constructor). This sets up the constructor function that is used for all objects of this type.
In the custom constructor, there are two required properties: type and mappings. Furthermore you can define extra properties and functions here, which are specifically related to that type. (dont worry, you can also extend props and funcs later on at any time...by type or instance)

<b>Note:</b> After writing this library, I realized this tool can just as easily be utilized by those looking to enrich any JavaScript object, regardless the objects origin; server, rest api, or some other source of JSON data. You can 'Entitize' just about anything.
<br />
####Server
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
    public Baz TheBaz { get; set; }
}

/// <summary>
/// Controller action to update the <c>Foo</c> object.
/// </summary>
/// <param name="foo">The foo to update</param>
/// <returns>HttpStatusCode.OK</returns>
[HttpPost]
public ActionResult UpdateFoo(Foo foo)
{
    // Do work with foo
    // Return appropriate response
    return new HttpStatusCodeResult(HttpStatusCode.OK);
}
```
####Client
######Include the entitize.js script
```html
<!-- include the entitize.js script -->
<script src="/path/to/entitize.js" type="text/javascript"></script>
```
######Define custom constructors
```javascript
// Serialize the object
var jsFoo = @Html.Raw(JsonConvert.SerializeObject(Model,
        new JsonSerializerSettings() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }));

// Define constructor for the object
Foo = function() {
    // these are required properties
    this.type = "Foo";
    this.mappings = [{propType:"int", propName:"FooId"},
                     {propType:"string", propName:"Name"},
                     {propType:"int", propName:"Age"},
                     {propType:"Array", propName:"Bars", nav:true, relationship:"one-to-many", childType:"Bar"},
                     {propType:"Baz", propName:"TheBaz", nav:true, relationship:"one-to-one", childType:"Baz"}];
    
    // Define a function for all instances of Foo
    this.fooFunc = function() {
        console.log(this);
    }
    
    // Define another!
    this.save = function() {
        // format the object based on the mappings
        var objToPost = this.entitize();
        post("/FooBarBaz/UpdateFoo", JSON.stringify(objToPost));
    }
}
...
// Define constructors for related types (Bar & Baz)
...
```
######Initialize with the Entitize framework
```javascript
// Initialize the constructor with Entitize
Entitize.initialize([Foo, ...]);

// Entitize the serialized object, passing its type
var jsEntityFoo = Entitize(jsFoo, "Foo");
console.log(jsEntityFoo2); //=> 

jsEntityFoo.entitize() //=> returns the object in the form as defined in mappings
jsEntityFoo.fooFunc() //=> calls the function defined in Foo's constructor
jsEntityFoo.save() //=> calls the save function defined in Foo's constructor
```
######Extend more props and functions
```javascript
// Define more functions for Foo type
var moreFooStuff = {
    fooOne: function() { console.log(this) },
    fooToo: function() { console.log(this) },
}
// Define more props for a specific Foo
var moreFooProps = { fooPropOne: "Kung-Foo!" }

// Extend the 'moreFooStuff' into the type 'Foo'
Entitize.extendType("Foo", moreFooStuff);

// Entend the 'moreFooStuff' into the object 'jsEntityFoo'
Entitize.extend(jsEntityFoo, moreFooProps);

jsEntityFoo.fooOne(); //=> 
otherFooEntity.fooTwo(); //=> 

console.log(jsEntityFoo.fooPropOne); //=> "Kung-Foo!"
console.log(otherFooEntity.fooPropOne); //=> undefined
```
