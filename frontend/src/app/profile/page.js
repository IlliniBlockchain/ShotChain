"use client"
import React, { useState, useEffect } from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import axios from 'axios'
import secureLocalStorage from 'react-secure-storage'
import AWS from "aws-sdk";
import Swal from 'sweetalert2'
import { formatAppDeadline, formatAnsDeadline, formatDate } from '@/app/date';


const question_tabs = [
  { name: 'Active Questions' },
  { name: 'Past Questions' }
]

const answer_tabs = [
  { name: 'Active Answers' },
  { name: 'Past Answers' }
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const uploadFile = async (addFile) => {
  if (typeof addFile === 'string') {
    return;
  }
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


const Profile = () => {
  const [selQ, setSelQ] = useState("Active Questions");
  const [selA, setSelA] = useState("Active Answers");
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [pastQuestions, setPastQuestions] = useState([]);
  const [activeAnswers, setActiveAnswers] = useState([]);
  const [pastAnswers, setPastAnswers] = useState([]);
  const [file, setFile] = useState(null);
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [rep, setRep] = useState(0);
  const [userData, setUserData] = useState({});


  useEffect(() => {
    const fetchProfile = async () => {
      await axios.get(`http://localhost:3001/profileQuestionsFalse/${secureLocalStorage.getItem('key')}`).then(response => {
        console.log("JAMES", secureLocalStorage.getItem('key'))
        const filteredData = response.data.filter(item => {
          const itemDate = new Date(item.date);
          const days = Number(item.appDeadline);
          const millisecondsPerDay = 24 * 60 * 60 * 1000;
          const addedTime = days * millisecondsPerDay;
          const newTimestamp = itemDate.getTime() + addedTime;
          const newDate = new Date(newTimestamp);
          const currentDate = new Date();
          return newDate > currentDate;
        });
        console.log(filteredData)
        setActiveQuestions(filteredData)
      })

      await axios.get(`http://localhost:3001/profileQuestionsTrue/${secureLocalStorage.getItem('key')}`).then(response => {
        setPastQuestions(response.data)
      })

      await axios.get(`http://localhost:3001/profileAnswersFalse/${secureLocalStorage.getItem('key')}`).then(response => {
        setActiveAnswers(response.data)
      })

      await axios.get(`http://localhost:3001/profileAnswersTrue/${secureLocalStorage.getItem('key')}`).then(response => {
        setPastAnswers(response.data)
      })
      await axios.get(`http://localhost:3001/user/${secureLocalStorage.getItem('key')}`).then(response => {
        setBio(response.data.bio);
        setFile(response.data.image)
        setUserName(response.data.name);
        setRep(response.data.rep)
        setUserData(response.data);
      })
    };

    fetchProfile();

  }, [])
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Update state to hold the selected file
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const formData = {}
    formData.name = userName;
    formData.bio = bio;
    await uploadFile(file).then(result => {
      if (typeof file === 'string') {
        formData.image = file;
      } else {
        formData.image = 'https://shotchain.s3.amazonaws.com/' + file.name;
      }
      formData.address = secureLocalStorage.getItem("key");
      axios.patch('http://localhost:3001/updateUser', formData)
        .then(response => {
          Swal.fire({
            title: "Congrats",
            text: "Your Profile has been successfully been updated!",
            icon: "success"
          });
        })
        .catch(error => {
          console.error('Error creating user:', error);
        });
      window.location.reload();
    });
  };

  return (
    <div className="mx-48 mb-32">
      <form className="mb-32">
        <div>
          <div className="border-b border-gray-900/10">
            <div class="about flex flex-col max-w-7xl pt-32 pb-16 lg:max-w-6xl">
              <h2 id="" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Profile</h2>
              <p className="mt-2 text-lg leading-8 text-gray-600 sm:text-2xl">
                Change your public information or view your past activity
              </p>
            </div>

            <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5 pb-6">
              🏆(Rep): {rep}
            </label>

            <div className="lg:max-w-6xl border-b border-gray-900/10 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Change your Username
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="Username"
                    className="block w-full rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="lg:max-w-6xl border-b border-gray-900/10 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                  Change your Short Bio
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                  <textarea
                    name="bio"
                    id="bio"
                    placeholder="Bio"
                    className="block w-full rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="cover-photo" className="block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Profile Picture
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <div className="flex w-full justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
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

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={handleSubmit}
          >
            Update Profile
          </button>
        </div>
      </form>

      <div>
        <div class="about flex flex-col max-w-7xl pb-16 lg:max-w-6xl">
          <h2 id="" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Your Questions</h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 sm:text-2xl">
            See your live questions and view past solutions
          </p>
        </div>

        <div className="hidden sm:block">
          <div className="isolate flex divide-x divide-gray-200 rounded-lg shadow" aria-label="Tabs">
            {question_tabs.map((tab, tabIdx) => (
              <button
                key={tab.name}
                className={classNames(
                  tab.name == selQ ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                  tabIdx === 0 ? 'rounded-l-lg' : '',
                  tabIdx === question_tabs.length - 1 ? 'rounded-r-lg' : '',
                  'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10'
                )}
                aria-current={tab.current ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default button click behavior
                  setSelQ(tab.name); // Then call your handler
                }}
              >
                <span>{tab.name}</span>
                <span
                  aria-hidden="true"
                  className={classNames(
                    tab.name == selQ ? 'bg-indigo-500' : 'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
          {(selQ === "Active Questions" ? activeQuestions : pastQuestions).slice().reverse().map((post) => (
            <a href={`/question/${post._id}`}>
              <article key={post.id} className="background-question background-question-hover rounded-2xl my-8 relative isolate flex flex-col gap-8 lg:flex-row">
                <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
                  <img
                    src={post.image}
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div>
                  <div className="flex items-center gap-x-4 text-xs mt-4">
                    <time dateTime={post.datetime} className="text-gray-500">
                      {formatDate(post.date)}
                    </time>
                    <div
                      className="text-gray-500 relative z-10 rounded-full bounty px-3 py-1.5 font-medium text-gray-600 flex flex-row"
                    >
                      <img src="/ethereum.png" height={15} width={10}></img>
                      <p className="ml-2">
                        {post.bounty}
                      </p>
                    </div>
                    <time dateTime={post.datetime} className={`text-gray-500 relative z-10 rounded-full ${selQ === "Active Questions" ? "app-deadline" : "q-finished"} px-3 py-1.5 font-medium text-gray-600 flex flex-row`}>
                      {selQ === "Active Questions" ? formatAppDeadline(post.date, post.appDeadline) : "Question Answered"}
                    </time>
                    <time dateTime={post.datetime} className="text-gray-500 relative z-10 rounded-full ans-deadline px-3 py-1.5 font-medium text-gray-600 flex flex-row">
                      {formatAnsDeadline(post.answerDeadline)}
                    </time>
                  </div>
                  <div className="group relative max-w-xl">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                      <a href={post.href}>
                        <span className="absolute inset-0" />
                        {post.title}
                      </a>
                    </h3>
                    <p className="mt-5 text-sm leading-6 text-gray-600">{post.description}</p>
                  </div>
                  <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                    <div className="relative flex items-center gap-x-4">
                      <img src={post.pfp} alt="" className="h-10 w-10 rounded-full bg-gray-50" />
                      <div className="text-sm leading-6">
                        <p className="font-semibold text-gray-900">
                          <div>
                            <span className="absolute inset-0" />
                            {post.name}
                          </div>
                        </p>
                        <p className="text-gray-600">{post.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>
      </div>

      <div>
        <div class="about flex flex-col max-w-7xl pb-16 lg:max-w-6xl mt-32">
          <h2 id="" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Your Answers</h2>
          <p className="mt-2 text-lg leading-8 text-gray-600 sm:text-2xl">
            See the status for the questions you've applied to and see your past answers
          </p>
        </div>


        <div className="hidden sm:block">
          <div className="isolate flex divide-x divide-gray-200 rounded-lg shadow" aria-label="Tabs">
            {answer_tabs.map((tab, tabIdx) => (
              <button
                key={tab.name}
                className={classNames(
                  tab.name == selA ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                  tabIdx === 0 ? 'rounded-l-lg' : '',
                  tabIdx === answer_tabs.length - 1 ? 'rounded-r-lg' : '',
                  'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10'
                )}
                aria-current={tab.current ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default button click behavior
                  setSelA(tab.name); // Then call your handler
                }}
              >
                <span>{tab.name}</span>
                <span
                  aria-hidden="true"
                  className={classNames(
                    tab.name == selA ? 'bg-indigo-500' : 'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {(selA == "Active Answers" ? activeAnswers : pastAnswers).slice().reverse().map((post) => (
            <div>
              <a href={`/question/${post._id}`}>
                <article key={post.id} className="background-question background-question-hover rounded-2xl my-8 relative isolate flex flex-col gap-8 lg:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
                    <img
                      src={post.image}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-x-4 text-xs mt-4">
                      <time dateTime={post.datetime} className="text-gray-500">
                        {formatDate(post.date)}
                      </time>
                      <div
                        className="text-gray-500 relative z-10 rounded-full bounty px-3 py-1.5 font-medium text-gray-600 flex flex-row"
                      >
                        <img src="/ethereum.png" height={15} width={10}></img>
                        <p className="ml-2">
                          {post.bounty}
                        </p>
                      </div>
                      <time dateTime={post.datetime} className={`text-gray-500 relative z-10 rounded-full ${selQ === "Active Answers" ? "app-deadline" : "q-finished"} px-3 py-1.5 font-medium text-gray-600 flex flex-row`}>
                        {selQ === "Active Answers" ? formatAppDeadline(post.date, post.appDeadline) : "You Answered"}
                      </time>
                      <time dateTime={post.datetime} className="text-gray-500 relative z-10 rounded-full ans-deadline px-3 py-1.5 font-medium text-gray-600 flex flex-row">
                        {formatAnsDeadline(post.answerDeadline)}
                      </time>
                    </div>
                    <div className="group relative max-w-xl">
                      <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                        <a href={post.href}>
                          <span className="absolute inset-0" />
                          {post.title}
                        </a>
                      </h3>
                      <p className="mt-5 text-sm leading-6 text-gray-600">{post.description}</p>
                    </div>
                    <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                      <div className="relative flex items-center gap-x-4">
                        <img src={post.pfp} alt="" className="h-10 w-10 rounded-full bg-gray-50" />
                        <div className="text-sm leading-6">
                          <p className="font-semibold text-gray-900">
                            <div>
                              <span className="absolute inset-0" />
                              {post.name}
                            </div>
                          </p>
                          <p className="text-gray-600">{post.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Profile