require('dotenv').config({path: './.env'})



const express = require('express')
const cors = require('cors');
const { connectToDb, getDb } = require('./db')
const { ObjectId } = require('mongodb');
//init app and middleware
const app = express()
app.use(express.json())
app.use(cors())
const PORT = process.env.PORT || 3001




let db
connectToDb((err) => {
    if (!err) {
        app.listen(PORT, () => {
            console.log(`app listening on port ${PORT}`)
        })
        db = getDb()
    }
})

app.get('/user/:address', async (req, res) => {
    try {
        let address = req.params.address;
        const collection = db.collection('Users');
        const findResult = await collection.findOne({ address: address });
        if (findResult) {
            console.log('Found document:', findResult);
            res.status(200).json(findResult);
        } else {
            res.status(200).json({});
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/user', async (req, res) => {
    const userData = req.body;
    try {
        const collection = db.collection('Users');
        const insertResult = await collection.insertOne(userData);
        res.status(201).json(insertResult);
    } catch (err) {
        console.error('Error inserting user:', err);
        res.status(500).send('Error inserting user into database');
    }
})

app.get('/questions', async (req, res) => {
    try {
      const collection = db.collection('Questions');
      // Find all items, sort them by createdAt in descending order (-1), and limit to 10
      const items = await collection.find({})
                                     .sort({ date: -1 })
                                     .limit(10)
                                     .toArray();
      res.status(200).json(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      res.status(500).send('Error fetching recent items');
    }
  });

  app.get('/questions/:id', async (req, res) => {
    try {
      let id = req.params.id;
      const collection = db.collection('Questions');
      // Find all items, sort them by createdAt in descending order (-1), and limit to 10
      const findResult = await collection.findOne({ _id: new ObjectId(id) });
        if (findResult) {
            console.log('Found document:', findResult);
            res.status(200).json(findResult);
        } else {
            res.status(200).json({});
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).send('Internal Server Error');
    }
  });



  app.post('/questions', async (req, res) => {
    const userData = req.body;
    console.log(userData);
    userData.date = new Date();
    try {
        const collection = db.collection('Questions');
        const insertResult = await collection.insertOne(userData);
        res.status(201).json(insertResult);
    } catch (err) {
        console.error('Error inserting user:', err);
        res.status(500).send('Error inserting user into database');
    }
})

app.patch('/questions/:id/comment', async (req, res) => {
    const questionId = req.params.id;
    const comment = req.body; // Assuming the new comment comes in the body

    if (!comment) {
        return res.status(400).send('Comment data is required');
    }

    try {
        const collection = db.collection('Questions');
        // Update the question by pushing a new comment into its comments array
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(questionId) },
            { $push: { comments: comment } }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).send('Question not found');
        }

        console.log('Added comment to question:', updateResult);
        res.status(200).json(updateResult);
    } catch (err) {
        console.error('Error updating question with new comment:', err);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/questions/:id/comments', async (req, res) => {
    try {
        const questionId = req.params.id;
        const collection = db.collection('Questions');

        // Assuming each question document has a 'comments' array field
        const question = await collection.findOne({ _id: new ObjectId(questionId) }, { projection: { comments: 1 } });

        if (question) {
            // Successfully found the question and its comments
            res.status(200).json(question.comments || []);
        } else {
            // No question found with the given ID
            res.status(404).send('Question not found');
        }
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.patch('/questions/:id/vote', async (req, res) => {
    const questionId = req.params.id;
    const { userId, vote } = req.body; // Expecting 'vote' to be either 'upvote' or 'downvote'

    try {
        const collection = db.collection('Questions');
        const question = await collection.findOne({ _id: new ObjectId(questionId) });

        if (!question) {
            return res.status(404).send('Question not found');
        }

        const updateQuery = {};
        const addToSet = {};
        const pull = {};

        // If user wants to upvote
        if (vote === 'upvote') {
            // Check if user has not already upvoted
            if (!question.upVotes.includes(userId)) {
                addToSet.upVotes = userId;
            }
            // If user has downvoted before, remove them from downvotes
            if (question.downVotes.includes(userId)) {
                pull.downVotes = userId;
            }
        }
        // If user wants to downvote
        else if (vote === 'downvote') {
            // Check if user has not already downvoted
            if (!question.downVotes.includes(userId)) {
                addToSet.downVotes = userId;
            }
            // If user has upvoted before, remove them from upvotes
            if (question.upVotes.includes(userId)) {
                pull.upVotes = userId;
            }
        }

        if (Object.keys(addToSet).length > 0) {
            updateQuery['$addToSet'] = addToSet;
        }
        if (Object.keys(pull).length > 0) {
            updateQuery['$pull'] = pull;
        }

        // If there's something to update
        if (Object.keys(updateQuery).length > 0) {
            await collection.updateOne({ _id: new ObjectId(questionId) }, updateQuery);
        }

        res.status(200).send('Vote updated successfully');
    } catch (err) {
        console.error('Error updating vote:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.patch('/questions/commentVote', async (req, res) => {
    const { userId, vote, questionId, commentId  } = req.body; // Assume 'vote' is either 'upvote' or 'downvote'
  
    try {
        const question = await db.collection('Questions').findOne({ _id: new ObjectId(questionId) });
        if (!question) {
            return res.status(404).send('Question not found');
        }

        const commentIndex = question.comments.findIndex(comment => comment.id === commentId);
        if (commentIndex === -1) {
            return res.status(404).send('Comment not found');
        }

        let updateOperation = { $set: {} };

        // If adding an upvote/downvote, use $addToSet to ensure no duplicates
        if (vote === 'upvote') {
            updateOperation.$addToSet = { [`comments.${commentIndex}.upVotes`]: userId };
            // Attempting to remove from downVotes if present
            updateOperation.$pull = { [`comments.${commentIndex}.downVotes`]: userId };
        } else if (vote === 'downvote') {
            updateOperation.$addToSet = { [`comments.${commentIndex}.downVotes`]: userId };
            // Attempting to remove from upVotes if present
            updateOperation.$pull = { [`comments.${commentIndex}.upVotes`]: userId };
        }
    
        // Execute MongoDB update
        await db.collection('Questions').updateOne(
            { _id: new ObjectId(questionId) },
            updateOperation
        );
    
        res.status(200).send('Vote updated');
    } catch (err) {
        console.error('Error updating vote:', err);
        res.status(500).send('Error updating vote');
    }
});
