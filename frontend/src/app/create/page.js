"use client"
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AWS from "aws-sdk";
import Swal from 'sweetalert2';
import secureLocalStorage from 'react-secure-storage';
import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'


export default function Create() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState("");
  const [appDeadline, setAppDeadline] = useState("");
  const [answerDeadline, setAnswerDeadline] = useState("");
  const [account, setAccount] = useState('');
  const [file, setFile] = useState(null);

  const [qLength, setQLength] = useState(0)


  useEffect(() => {
    const loadQuestions = async () => {
      axios.get(`http://localhost:3001/questions`).then(response => {
        setQLength(response.data.length + 1)
      })
    }
    loadQuestions().catch(console.error)
    if (secureLocalStorage.getItem("key") != null) {
      setAccount(secureLocalStorage.getItem("key"))
    }
  }, [])

  const uploadFile = async (addFile) => {
    console.log(addFile.name)
    const S3_BUCKET = "shotchain";
    const REGION = "us-east-1";
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_ACCESS_KEY,
      secretAccessKey: process.env.NEXT_PUBLIC_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    const params = {
      Bucket: S3_BUCKET,
      Key: addFile.name,
      Body: addFile,
    };

    var upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        console.log(
          "Uploading " + parseInt((evt.loaded * 100) / evt.total) + "%"
        );
      })
      .promise();

    await upload.then((err, data) => {
      console.log(err);
      return 'https://shotchain.s3.amazonaws.com/' + addFile.name;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (bounty <= 0) return;
    if (appDeadline <= 0) return;
    if (answerDeadline <= 0) return;
    if (title.length == 0 || description.length == 0) return;

    const formData = {}
    formData.title = title;
    formData.description = description;
    formData.bounty = bounty;
    formData.answerDeadline = answerDeadline;
    formData.appDeadline = appDeadline;
    formData.qid = qLength;
    console.log(qLength)

    if (file) {
      await uploadFile(file).then(result => {
        formData.image = 'https://shotchain.s3.amazonaws.com/' + file.name;
        formData.address = account;
        axios.get(`http://localhost:3001/user/${account}`)
          .then(response => {
            formData.name = response.data.name;
            formData.pfp = response.data.image;
            formData.comments = [];
            formData.selected = "";
            formData.answer = {
              comment: "",
              file: "",
            }
            formData.isDisputed = false;
            formData.expiry = "";
            formData.done = false;

            try {
              axios.post('http://localhost:3001/questions', formData)
                .then(response => {
                  console.log('User created:', response.data);
                  // Optionally, clear the form or give user feedback
                  Swal.fire({
                    title: "Congrats",
                    text: "Your question has been successfully posted!",
                    icon: "success"
                  });
                  setTitle('');
                  setDescription('');
                  setBounty(0);
                  setAppDeadline(0);
                  setAnswerDeadline(0);
                  setFile(null);
                })
                .catch(error => {
                  console.error('Error creating user:', error);
                });
            } catch (error) {
              console.log(error);
            }
          })
      });
    } else {
      formData.image = 'default';
      formData.address = account;
      axios.get(`http://localhost:3001/user/${account}`)
        .then(response => {
          formData.name = response.data.name;
            formData.pfp = response.data.image;
            formData.comments = [];
            formData.selected = "";
            formData.answer = {
              comment: "",
              file: "",
            }
            formData.isDisputed = false;
            formData.expiry = "";
            formData.done = false;
          try {
            axios.post('http://localhost:3001/questions', formData)
              .then(response => {
                console.log('User created:', response.data);
                // Optionally, clear the form or give user feedback
                Swal.fire({
                  title: "Congrats",
                  text: "Your question has been successfully posted!",
                  icon: "success"
                });
                setTitle('');
                setDescription('');
                setBounty(0);
                setFile(null);
              })
              .catch(error => {
                console.error('Error creating user:', error);
              });
          } catch (error) {
            console.log(error);
          }
        })
    }


  };

  // Function to handle file selection
  const handleFileChange = (e) => {
    console.log(e.target.files[0].name)
    setFile(e.target.files[0]); // Update state to hold the selected file
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12 sm:space-y-16 ml-8">
        <div>
          <h2 className="text-base font-semibold leading-7 text-gray-900 mt-8">Add Question</h2>
          <div className="mt-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Title
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    placeholder="Title"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Description
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <textarea
                  type="text"
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Description"
                  className="block w-full px-1.5 max-w-2xl rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
              <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                Bounty (STRK)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="number"
                    name="bounty"
                    id="bounty"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={bounty}
                    onChange={(e) => setBounty(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
              <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                Deadline for Applications (Days)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="number"
                    name="bounty"
                    id="bounty"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={appDeadline}
                    onChange={(e) => setAppDeadline(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
              <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                Answer Timeframe (Days)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="number"
                    name="bounty"
                    id="bounty"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={answerDeadline}
                    onChange={(e) => setAnswerDeadline(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5">
                Photo
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-2xl justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                    <p className="text-xs leading-5 text-gray-600">Selected File: {file != null ? file.name : "None"}</p>
                  </div>
                </div>
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
  )
}