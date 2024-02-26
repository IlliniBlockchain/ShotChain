"use client"
import React, {useState, useEffect} from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';

const Case6 = ({id, account}) => {
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
        };
        console.log(commentF)
        // Update state with comments that now include user data
        setAnswer(commentF);
        });
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
  
    fetchCommentsAndUsers();
  }, []);


  return (
    <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Final Answer</h2>
        <ul className="space-y-4">
            <li key={answer.id} className="bg-gray-100 p-4 rounded-lg flex">
              <img src={answer.pfp} alt="profile" className="w-10 h-10 rounded-full mr-4" />
              <div>
                <p className="font-semibold">{answer.name}</p>
                <p>{answer.comment}</p>
              </div>
              <a href={answer.file} download>Download File</a>
            </li>
        </ul>
      </div>
  )
}

export default Case6