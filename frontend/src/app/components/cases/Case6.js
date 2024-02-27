"use client"
import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';
import { AutoScaling } from 'aws-sdk';

const Case6 = ({ id, account }) => {
  const [answer, setAnswer] = useState({});


  useEffect(() => {
    const fetchCommentsAndUsers = async () => {
      try {
        // Fetch comments
        const response = await axios.get(`http://localhost:3001/questions/${id}`);
        let comment = response.data.answer;

        // Loop through each comment to fetch user data
        // Assuming there's an endpoint to fetch user data by user ID
        await axios.get(`http://localhost:3001/user/${response.data.selected}`).then(resp => {
          // Merge comment with user data
          const commentF = {
            ...comment,
            pfp: resp.data.image,
            name: resp.data.name,
            address: resp.data.address
          };
          console.log(commentF)
          // Update state with comments that now include user data
          console.log(commentF);
          setAnswer(commentF);
        });
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };

    fetchCommentsAndUsers();
  }, []);

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


  return (
    <div className="py-4 mb-32">
      <h2 className="text-2xl font-semibold mb-4">Final Answer</h2>
      <ul className="space-y-4">
        <li key={answer.id} className="bg-gray-100 p-4 rounded-lg flex application">
          <img src={answer.pfp} alt="profile" className="cursor-pointer pfp-hover w-10 h-10 rounded-full mr-4" onClick={() => onProfileClick(answer.address)} />
          <div>
            <p className="font-semibold mb-2">{answer.name}</p>
            <p className="mb-2">{answer.comment}</p>
            <a className="download" href={answer.file} download><u>Download File</u></a>
          </div>
        </li>
      </ul>
    </div>
  )
}

export default Case6