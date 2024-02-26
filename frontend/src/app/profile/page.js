"use client"
import React, {useState, useEffect} from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import axios from 'axios'
import secureLocalStorage from 'react-secure-storage'
import AWS from "aws-sdk";
import Swal from 'sweetalert2'


const question_tabs = [
    { name: 'Active Questions'},
    { name: 'Past Questions' }
  ]

const answer_tabs = [
    { name: 'Active Answers'},
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


    useEffect(() => {
      const fetchProfile = async () => {
        await axios.get(`http://localhost:3001/profileQuestionsFalse/${secureLocalStorage.getItem('key')}`).then(response => {
          setActiveQuestions(response.data)
        })

        await axios.get(`http://localhost:3001/profileQuestionsTrue/${secureLocalStorage.getItem('key')}`).then(response => {
          setPastQuestions(response.data)
        })

        await axios.get(`http://localhost:3001/profileAnswersFalse/${secureLocalStorage.getItem('key')}`).then(response => {
          console.log(response.data)
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
          formData.address =  secureLocalStorage.getItem("key");
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
        });
    };

  return (
    <form>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Profile</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            This information will be displayed publicly so be careful what you share.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="Username"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              </div>
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                🔥 (Rep): {rep}
              </label>
            </div>

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                Bio
              </label>
              <div className="mt-2">
                <textarea
                  name="bio"
                  id="bio"
                  placeholder="Bio"
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">Write a few sentences about yourself.</p>
            </div>

            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900">
                Profile Picture
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange}/>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
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
          Save
        </button>
      </div>
      <div>
        <h1>Your Questions</h1>
        <div>
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
                    tab.name == selQ ? 'bg-indigo-500' :'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                    )}
                />
                </button>
            ))}
            </div>
        </div>
        </div>
      </div>
      <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
              {(selQ === "Active Questions" ? activeQuestions : pastQuestions).map((post) => (
                <a href={`/question/${post._id}`}>
                <article key={post.id} className="relative isolate flex flex-col gap-8 lg:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
                    <img
                      src={post.image}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-x-4 text-xs">
                      <time dateTime={post.datetime} className="text-gray-500">
                        {post.date}
                      </time>
                      <div
                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 flex flex-row"
                      >
                        <img src="/strk.jpeg" height={20} width={20}></img>
                        <p className="ml-2 text-lg">
                        {post.bounty}
                        </p>
                      </div>
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
      <div>
        <h1>Your Answers</h1>
        <div>
        <div className="hidden sm:block">
            <div className="isolate flex divide-x divide-gray-200 rounded-lg shadow" aria-label="Tabs">
            {answer_tabs.map((tab, tabIdx) => (
                <button
                key={tab.name}
                className={classNames(
                    tab.name == selA ? 'text-gray-900' :'text-gray-500 hover:text-gray-700',
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
                    tab.name == selA ? 'bg-indigo-500' :'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                    )}
                /> 
                </button>
            ))}
            </div>
        </div>
        <ul className="space-y-4">
          {(selA == "Active Answers" ? activeAnswers : pastAnswers).map((comment) => (
            <li key={comment.id} className="bg-gray-100 p-4 rounded-lg flex">
              <img src={comment.pfp} alt="profile" className="w-10 h-10 rounded-full mr-4" />
              <div>
                <p className="font-semibold">{comment.name}</p>
                <p>{comment.comment}</p>
              </div>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </form>
  )
}

export default Profile