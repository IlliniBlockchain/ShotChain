"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';

const CommentSection = ({id}) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [account, setAccount] = useState({name: '', address: '', imageURL: ''});

    useEffect(() => {
        const loadWeb3 = async () => {
            // Modern dapp browsers...
            if (window.ethereum) {
              const temp = await window.ethereum.request({ method: 'eth_requestAccounts' });
              if (temp) {
                axios.get(`http://localhost:3001/user/${temp[0]}`)
                .then(response => {
                    setAccount({
                        name: response.data.name,
                        address: response.data.address,
                        imageURL: response.data.image,
                      });
                });
              }
            }
            // Legacy dapp browsers...
            else if (window.web3) {
                window.web3 = new Web3(window.web3.currentProvider);
            }
            // Non-dapp browsers...
            else {
                window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
          }
          loadWeb3().catch(console.error)


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
            upVotes: [],
            downVotes: [],
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

      const handleVoteClick = async (voteType, commentId) => {
        try {
            // Replace `userId` with the actual user's ID from your context or state
            const userId = account.name; // Placeholder: Use actual logic to get current user's ID
            const response = await axios.patch(`http://localhost:3001/questions/commentVote`, {
                userId: userId,
                vote: voteType,
                questionId: id,
                commentId: commentId
            });

            // Update the local state to reflect the vote if needed
            // For example, re-fetch comments or adjust the local comments state directly
            console.log('Vote successfully updated', response.data);
        } catch (error) {
            console.error('Error updating vote', error);
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
                <div className="flex items-center mt-2">
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                  onClick={() => handleVoteClick('upvote', comment.id)}>↑</button>
                  <span>{comment.upVotes.length - comment.downVotes.length}</span>
                  <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2"
                  onClick={() => handleVoteClick('downvote', comment.id)}>↓</button>
                </div>
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