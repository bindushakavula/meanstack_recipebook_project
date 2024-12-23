const { MongoClient } = require('mongodb');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
mongoose.connect('mongodb://localhost/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Recipe = mongoose.model('Recipe', {
  recipeName: String,
  description: String,
  userEmail: String,
});

// MongoDB connection setup
const uri = 'mongodb://localhost:27017/mydb';
const client = new MongoClient(uri, { useNewUrlParser: true });

// Middleware to parse form data from POST requests
app.use(bodyParser.urlencoded({ extended: true }));


// Serve the registration form HTML page
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/registration-form.html');
});

// Define a route to handle form submissions for registration
// Define a route to handle form submissions for registration
app.post('/register', async (req, res) => {
    try {
      await client.connect();
      const database = client.db('mydb');
      const collection = database.collection('registrations');
  
      const { firstName, lastName, phoneNumber, email, password } = req.body;
  
      const registration = {
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
      };
  
      const result = await collection.insertOne(registration);
  
      // After successful registration, redirect to the login page
      res.redirect('/login');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.close();
    }
  });
  
// Serve the login form HTML page
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login-form.html');
});

// Define a route to handle login attempts
// Define a route to handle login attempts
app.post('/login', async (req, res) => {
    try {
      await client.connect();
      const database = client.db('mydb');
      const collection = database.collection('registrations');
  
      const { email, password } = req.body;
  
      const user = await collection.findOne({ email, password });
  
      if (user) {
        // After successful login, redirect to the home page and pass user details
        res.redirect(`/home?user=${JSON.stringify(user)}`);
      } else {
        res.json({ message: 'Login failed. Invalid email or password.' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.close();
    }
  });
  
// Serve the home page
app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
  });


  app.get('/recipe/add', (req, res) => {
    res.sendFile(__dirname + '/add-recipe.html');
});

// Add a new recipe to MongoDB
// Add a new recipe to MongoDB
app.post('/recipe/add', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('mydb');
        const collection = database.collection('recipes');

        const { recipeName, description, userEmail } = req.body;

        const recipe = {
            recipeName,
            description,
            userEmail,
        };

        const result = await collection.insertOne(recipe);

        if (result.acknowledged) { // Check if the insertion was acknowledged
            res.status(201).json({ message: 'Recipe added successfully' });
        } else {
            console.error('Recipe insertion failed: MongoDB result', result);
            res.status(500).json({ error: 'Recipe insertion failed' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

app.get('/recipe/delete', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(__dirname + '/delete-recipe.html');
});

// Add a route to delete a recipe by name
app.post('/delete/recipe', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('mydb');
    const collection = database.collection('recipes');

    // Get the recipe name to delete from the request body
    const recipeNameToDelete = req.body.recipeName;

    // Use the `deleteOne` method to delete the recipe by its name
    const result = await collection.deleteOne({ recipeName: recipeNameToDelete });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: 'Recipe deleted successfully' });
    } else {
      res.json({ success: false, message: 'Recipe not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});


// ...
app.get('/recipe/update', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(__dirname + '/update-recipe.html');
});
app.post('/update/recipe', async (req, res) => {
  try {
      await client.connect();
      const database = client.db('mydb');
      const collection = database.collection('recipes');

      // Get data from the request body
      const { recipeName, newdescription } = req.body;

      // Find the recipe to update by its name
      const filter = { recipeName };

      // Define the new values for the update
      const update = {
          $set: {
              recipeName,
              description:newdescription,
          },
      };

      // Perform the update
      const result = await collection.updateOne(filter, update);

      if (result.modifiedCount === 1) {
          res.json({ success: true, message: 'Recipe updated successfully' });
      } else {
          res.json({ success: false, message: 'Recipe not found or no changes made' });
      }
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  } finally {
      await client.close();
  }
});

app.get('/images/:imageName', (req, res) => {
  const imageName = req.params.imageName;

  // Define a mapping of file extensions to Content-Type
  const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'avif':'image/avif'
      // Add more mappings as needed
  };

  // Extract the file extension
  const fileExtension = imageName.split('.').pop().toLowerCase();

  // Check if the file extension is in the mapping
  if (contentTypeMap[fileExtension]) {
      const contentType = contentTypeMap[fileExtension];
      res.setHeader('Content-Type', contentType);

      // Serve the image file
      res.sendFile(__dirname + '/images/' + imageName);
  } else {
      // Handle unsupported file types
      res.status(415).send('Unsupported Media Type');
  }
});

app.get('/home', (req, res) => {
  res.render('home'); // Renders the 'home.ejs' template
});

app.get('/displayall', async (req, res) => {
  try {
    // Fetch data from the MongoDB collection
    const recipes = await Recipe.find();
    
    // Render an HTML page to display the data
    res.render('displayall', { recipes });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching data.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

