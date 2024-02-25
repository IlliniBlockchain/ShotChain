"use client"
import React, { useState, useEffect } from 'react';
import CommentSection from '@/app/components/Comment';
import secureLocalStorage from 'react-secure-storage';

const QuestionPage = () => {
    const [questionData, setQuestionData] = useState(null);
    const [id, setId] = useState('');
    const [account, setAccount] = useState('');
  
    useEffect(() => {
      const fetchQuestionData = async () => {
        const url = window.location.href;
        const parts = url.split('/');
        const objectId = parts[parts.length - 1].split('#')[0].split('?')[0]; // Assuming this is your object ID
        setId(objectId);
        try {
          console.log(objectId)
          const response = await fetch(`http://localhost:3001/questions/${objectId}`); // Adjust the URL/port as needed
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          setQuestionData(data);
        } catch (error) {
          console.error("Failed to fetch question data:", error);
        }
      };
  
      fetchQuestionData();
      if (secureLocalStorage.getItem("key") != null) {
        setAccount(secureLocalStorage.getItem("key"))
      }
    }, []); // The empty array ensures this effect runs only once after the initial render
  
    return (
      <div>
        {questionData ? (
          <div>
            <article key={questionData._id} className="relative isolate flex flex-col gap-8 lg:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-square lg:w-64 lg:shrink-0">
                    <img
                      src={questionData.image}
                      alt=""
                      className="absolute inset-0 h-full w-full rounded-2xl bg-gray-50 object-cover"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-x-4 text-xs">
                      <time dateTime={questionData.date} className="text-gray-500">
                        {questionData.date}
                      </time>
                      <div
                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 flex flex-row"
                      >
                        <img src="/strk.jpeg" height={20} width={20}></img>
                        <p className="ml-2 text-lg">
                        {questionData.bounty}
                        </p>
                      </div>
                    </div>
                    <div className="group relative max-w-xl">
                      <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                        <a href={questionData.href}>
                          <span className="absolute inset-0" />
                          {questionData.title}
                        </a>
                      </h3>
                      <p className="mt-5 text-sm leading-6 text-gray-600">{questionData.description}</p>
                    </div>
                    <div className="mt-6 flex border-t border-gray-900/5 pt-6">
                      <div className="relative flex items-center gap-x-4">
                        <img src={questionData.pfp} alt="" className="h-10 w-10 rounded-full bg-gray-50" />
                        <div className="text-sm leading-6">
                          <p className="font-semibold text-gray-900">
                            <div>
                              <span className="absolute inset-0" />
                              {questionData.name}
                            </div>
                          </p>
                          <p className="text-gray-600">{questionData.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                <CommentSection id={id}>
                </CommentSection>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    );
  };
  
  export default QuestionPage;