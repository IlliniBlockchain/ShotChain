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
import { Provider, Contract, Account, json, SequencerProvider } from 'starknet';
import jsonData from '../abis/abi.json'
import ercJsonData from '../abis/erc20abi.json'
import { constants, RpcProvider } from 'starknet';
import { connect, disconnect } from "get-starknet"




 // for testnet

const testAddress = process.env.NEXT_PUBLIC_CONTRACT;
const erc20Address = process.env.NEXT_PUBLIC_ETHCONTRACT

export default function Create() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState("");
  const [appDeadline, setAppDeadline] = useState("");
  const [answerDeadline, setAnswerDeadline] = useState("");
  const [account, setAccount] = useState('');
  const [file, setFile] = useState(null);
  const [starkAcnt, setStarkAcnt] = useState();

  const [qLength, setQLength] = useState(0)


  useEffect(() => {
    const loadQuestions = async () => {
      axios.get(`http://localhost:3001/questions`).then(response => {
        setQLength(response.data.length + 1)
      })
      await connect().then(resp => {
        setStarkAcnt(resp.account);
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
    const provider = new RpcProvider({
      nodeUrl: 'https://starknet-goerli.infura.io/v3/a6f468d4cc434e2e8a324fc56dc4e860',
    });
    const qidContract = new Contract(jsonData, process.env.NEXT_PUBLIC_CONTRACT, provider);
    const qid = await qidContract.get_qid();
    formData.qid = Number(qid) + 1;
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
                  ID = response.data.insertedId;
                  // Optionally, clear the form or give user feedback
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
                ID = response.data.insertedId;
                // Optionally, clear the form or give user feedback
                Swal.fire({
                  title: "Congrats",
                  text: "Your question has been successfully posted!",
                  icon: "success"
                });
              })
              .catch(error => {
                console.error('Error creating user:', error);
              });
          } catch (error) {
            console.log(error);
          }
        })
    }
    const erc20Contract = new Contract(ercJsonData, erc20Address, provider)
    erc20Contract.connect(starkAcnt);
    const tx = await erc20Contract.approve(process.env.NEXT_PUBLIC_CONTRACT, BigInt((bounty) * (10 ** 18)))
    await provider.waitForTransaction(tx.transaction_hash);
    const myTestContract = new Contract(jsonData, process.env.NEXT_PUBLIC_CONTRACT, provider);
    myTestContract.connect(starkAcnt);
    await myTestContract.ask_question(BigInt(bounty * (10 ** 18))).then(resp => {
      console.log(resp);
    });
    setTitle('');
    setDescription('');
    setBounty(0);
    setAppDeadline(0);
    setAnswerDeadline(0);
    setFile(null);
    Swal.fire({
      title: "Congrats",
      text: "Your question has been successfully posted!",
      icon: "success"
    });

  };

  // Function to handle file selection
  const handleFileChange = (e) => {
    console.log(e.target.files[0].name)
    setFile(e.target.files[0]); // Update state to hold the selected file
  };


  return (
    <form onSubmit={handleSubmit}>
      <div className="">
        <div>
          <div class="about flex flex-col mx-48 pt-32 pb-16 lg:max-w-6xl">
            <h2 id="" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Create a Question</h2>
            <p className="mt-2 text-lg leading-8 text-gray-600 sm:text-2xl">
              Need expert advise? Define your question and place a bounty!
            </p>
          </div>
          <div className="mx-48 lg:max-w-6xl border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t">
            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Title
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <input
                  type="text"
                  name="title"
                  id="title"
                  placeholder="Title"
                  className="block w-full rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="about" className="block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Description
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <textarea
                  type="text"
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Description"
                  className="block w-full rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Bounty (ETH)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <input
                  type="text"
                  name="bounty"
                  id="bounty"
                  placeholder="0"
                  className="block rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Deadline for Application (Days)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <input
                  type="text"
                  name="appDeadline"
                  id="appDeadline"
                  placeholder="0"
                  className="block rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                  value={appDeadline}
                  onChange={(e) => setAppDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="username" className="w-full block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Answer Timeframe (Days)
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0 ml-32">
                <input
                  type="text"
                  name="answerDeadline"
                  id="answerDeadline"
                  placeholder="0"
                  className="block rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset sm:text-sm sm:leading-6"
                  value={answerDeadline}
                  onChange={(e) => setAnswerDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
              <label htmlFor="cover-photo" className="block text-lg font-medium leading-6 text-gray-900 sm:pt-1.5">
                Photo
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
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6  mr-48 mb-24">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Submit Question
        </button>
      </div>
    </form >
  )
}