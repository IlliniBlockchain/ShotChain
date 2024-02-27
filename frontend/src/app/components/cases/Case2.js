"use client"
import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';
import { AutoScaling } from 'aws-sdk';

const Case2 = ({ id, account }) => {
  const [comments, setComments] = useState([]);

  const updateQuestion = async (address) => {
    try {
      const response = await axios.patch(`http://localhost:3001/questions/${id}`, {
        selected: address
      });
      Swal.fire({
        title: "Good job!",
        text: "You have successfully picked your applicant!",
        icon: "success"
      });
      window.location.reload();
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const onProfileClick = async (addy) => {
    await axios.get(`http://localhost:3001/user/${addy}`).then(response => {
      Swal.fire({
        title: `${response.data.name} (Rep: ${response.data.rep})`,
        text: response.data.bio,
        imageUrl: response.data.image,
        imageWidth: 250,
        imageHeight: AutoScaling,
        imageAlt: "Custom image"
      });
    })
  }

  useEffect(() => {
    const fetchCommentsAndUsers = async () => {
      try {
        // Fetch comments
        const response = await axios.get(`http://localhost:3001/questions/${id}/comments`);
        let commentsWithUserData = [];

        // Loop through each comment to fetch user data
        for (const comment of response.data || []) {
          try {
            // Assuming there's an endpoint to fetch user data by user ID
            const userResponse = await axios.get(`http://localhost:3001/user/${comment.address}`);
            // Merge comment with user data
            const commentWithUser = {
              ...comment,
              pfp: userResponse.data.image,
              name: userResponse.data.name,
              address: userResponse.data.address
            };
            commentsWithUserData.push(commentWithUser);
          } catch (userError) {
            console.error("Failed to fetch user data for comment", comment.id, userError);
            // Optionally handle comments without user data differently here
            commentsWithUserData.push(comment); // Adds the comment without user data
          }
        }

        // Update state with comments that now include user data
        setComments(commentsWithUserData);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };

    fetchCommentsAndUsers();
  }, []);

  return (
    <div className="py-4 mb-32">
      <h2 className="text-2xl font-semibold mb-4">Applications</h2>
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="bg-gray-100 p-4 rounded-lg application">
            <img src={comment.pfp} alt="profile" className="pfp-hover cursor-pointer w-10 h-10 rounded-full mr-4" onClick={() => onProfileClick(comment.address)} />
            <div>
              <p className="font-semibold mb-2">{comment.name}</p>
              <p className="mb-2">{comment.comment}</p>
              <a className="download" href={comment.file} download>Download File</a>
            </div>
            <button
              type="button"
              className="rounded-md bg-indigo-600 h-12 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => updateQuestion(comment.address)}
            >
              Select User
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Case2