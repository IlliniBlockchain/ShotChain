"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import secureLocalStorage from 'react-secure-storage';

const CommentSection = ({id}) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [account, setAccount] = useState({name: '', address: '', imageURL: ''});

    useEffect(() => {

            if (secureLocalStorage.getItem("key") != null) {
              axios.get(`http://localhost:3001/user/${secureLocalStorage.getItem("key")}`)
                .then(response => {
                    setAccount({
                        name: response.data.name,
                        address: response.data.address,
                        imageURL: response.data.image,
                      });
                });
            }


        const fetchComments = async () => {
          try {
            const response = await axios.get(`http://localhost:3001/questions/${id}/comments`);
            console.log(response)
            setComments(response.data || []);
          } catch (error) {
            console.error("Failed to fetch comments", error);
          }
        };
    
        fetchComments();
      }, []);

      const handleAddComment = async (e) => {
        e.preventDefault();
        try {
          const response = await axios.patch(`http://localhost:3001/questions/${id}/comment`, {
            name: account.name,
            comment: newComment,
            pfp: account.imageURL,
            id: comments.length
            // You can add additional fields here as necessary, such as votes or profilePic
          });
          // Optionally, re-fetch comments or update local state to include the new comment
          setComments([...comments, response.data]); 
          setNewComment('');
        } catch (error) {
          console.error("Failed to add comment", error);
        }
      };
    
  
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="bg-gray-100 p-4 rounded-lg flex">
              <img src={comment.pfp} alt="profile" className="w-10 h-10 rounded-full mr-4" />
              <div>
                <p className="font-semibold">{comment.name}</p>
                <p>{comment.comment}</p>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddComment} className="mt-4 flex">
          <input
            type="text"
            placeholder="Your comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mr-2 p-2 border rounded-md flex-1"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add Comment
          </button>
        </form>
      </div>
    );
  };
  
  export default CommentSection;