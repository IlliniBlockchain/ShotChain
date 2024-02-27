"use client"
import React, { useState, useEffect } from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import axios from 'axios';
import Swal from 'sweetalert2';
import { Provider, Contract, Account, json } from 'starknet';
import jsonData from '../../abis/abi.json'
import { constants } from 'starknet';
import { connect, disconnect } from "get-starknet"

const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });
const testAddress = process.env.NEXT_PUBLIC_CONTRACT;


const Case5 = ({ id, account }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState("Good");
  const [answer, setAnswer] = useState("");
  const [starkAcnt, setStarkAcnt] = useState();
  const [qid, setQid] = useState();
  const [answerer, setAnswerer] = useState()

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(rating)
    if (rating == "Good") {
      // Fetch the current user's data to get the rep score
      const userResponse = await axios.get(`http://localhost:3001/user/${answer.address}`);
      const currentUserData = userResponse.data;

        await axios.patch(`http://localhost:3001/questions/${id}`, {
        feedback: {
          feedback: feedback,
          rating: rating // This will be an empty string if there's no file, which is fine
        },
        done: true,
      });

      // Update the user's rep score by adding 20
      if (currentUserData && currentUserData.rep !== undefined) {
        const updatedRep = currentUserData.rep + 20;

        // Patch request to update the user's rep
        await axios.patch(`http://localhost:3001/users/${answer.address}`, {
          rep: updatedRep
        });

       

        const myTestContract = new Contract(jsonData, process.env.NEXT_PUBLIC_CONTRACT, provider);
        myTestContract.connect(starkAcnt);
        await myTestContract.approve(qid, answerer).then(resp => {
          console.log(resp);
        });
      }
    }
    if (rating == "Indifferent") {

      await axios.patch(`http://localhost:3001/questions/${id}`, {
        feedback: {
          feedback: feedback,
          rating: rating // This will be an empty string if there's no file, which is fine
        },
        done: true,
      });
      const myTestContract = new Contract(jsonData, process.env.NEXT_PUBLIC_CONTRACT, provider);
        myTestContract.connect(starkAcnt);
        await myTestContract.approve(qid, answerer).then(resp => {
          console.log(resp);
        });

    }
    if (rating == "Bad") {
      // Fetch the current user's data to get the rep score
      const userResponse = await axios.get(`http://localhost:3001/user/${answer.address}`);
      const currentUserData = userResponse.data;

      await axios.patch(`http://localhost:3001/questions/${id}`, {
        feedback: {
          feedback: feedback,
          rating: rating // This will be an empty string if there's no file, which is fine
        },
        dispute: true,
        done: true
      });

      // Update the user's rep score by adding 20
      if (currentUserData && currentUserData.rep !== undefined) {
        const updatedRep = currentUserData.rep - 20;

        // Patch request to update the user's rep
        await axios.patch(`http://localhost:3001/users/${answer.address}`, {
          rep: updatedRep
        });
      }

      const myTestContract = new Contract(jsonData, process.env.NEXT_PUBLIC_CONTRACT, provider);
        myTestContract.connect(starkAcnt);
        await myTestContract.deny(qid, answerer).then(resp => {
          console.log(resp);
      });
    }
    Swal.fire({
      title: "Good job!",
      text: "Your feedback has been submitted",
      icon: "success"
    });
    window.location.reload();
    setFeedback('');
  };

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
          setAnswer(commentF);
        });

        await connect().then(resp => {
          setStarkAcnt(resp.account);
        })
        await axios.get(`http://localhost:3001/questions/${id}`).then(resp => {
          setAnswerer(resp.data.selected)
          setQid(resp.data.qid);
        })
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
    fetchCommentsAndUsers();
  }, [])

  const handleRatingChange = (event) => {
    setRating(event.target.value);
  };

  return (
    <div className="mb-32">
      <div className="py-4 mb-32">
        <h2 className="text-2xl font-semibold mb-4">Final Answer</h2>
        <ul className="space-y-4">
          <li key={answer.id} className="bg-gray-100 p-4 rounded-lg flex">
            <img src={answer.pfp} alt="profile" className="w-10 h-10 rounded-full mr-4" />
            <div>
              <p className="font-semibold mb-2">{answer.name}</p>
              <p className="mb-2">{answer.comment}</p>
              <a className="download" href={answer.file} download><u>Download File</u></a>
            </div>
          </li>
        </ul>
      </div>
      <form onSubmit={handleSubmit} >
        <div className="space-y-12 sm:space-y-16 ml-8">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900 mt-8">Add Feedback</h2>
            <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Feedback
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <textarea
                    type="text"
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Description"
                    className="block w-full px-1.5 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="rating" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Rating
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <select
                    id="rating"
                    name="rating"
                    className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    defaultValue="Good"
                    value={rating} // Controlled component
                    onChange={handleRatingChange} // Attach the event handler
                  >
                    <option>Good</option>
                    <option>Indifferent</option>
                    <option>Bad</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6 mr-8">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  )
}

export default Case5