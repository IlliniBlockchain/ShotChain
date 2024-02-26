import React, { useState } from 'react'
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import AWS from "aws-sdk";
import axios from 'axios';
import Swal from 'sweetalert2';

const uploadFile = async (addFile) => {
  if (!addFile) {
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

const Case1 = ({id, account}) => {

  const [comment, setComment] = useState('')
  const [file, setFile] = useState(null);

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await uploadFile(file).then(res => {
        let fileName = ""
        if (file) {
          fileName = 'https://shotchain.s3.amazonaws.com/' + file.name;
        }
        axios.patch(`http://localhost:3001/questions/${id}/comment`, {
        address: account,
        comment: comment,
        file: fileName,
        // You can add additional fields here as necessary, such as votes or profilePic
      });
      // Optionally, re-fetch comments or update local state to include the new comment
      Swal.fire({
        title: "Good job!",
        text: "Your application has been successfully submitted!",
        icon: "success"
      });
      setComment('');
      setFile(null);
      })
    } catch (error) {
      console.error("Failed to add comment", error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Update state to hold the selected file
  };


  return (
    <form onSubmit={handleAddComment}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Application</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Apply to answer this question!
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                Comment
              </label>
              <div className="mt-2">
                <textarea
                  type="text"
                  placeholder="Your comment"
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={comment}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">Write a few sentences on why you are qualified to answer this question.</p>
            </div>

            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900">
                Supporting Document
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
        >
          Post
        </button>
      </div>
    </form>
  )
}

export default Case1