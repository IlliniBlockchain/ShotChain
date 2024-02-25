"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import secureLocalStorage from "react-secure-storage";


  
  export default function Home() {

    const [questions, setQuestions] = useState('');
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState('');
    useEffect(() => {
      const loadQuestions = async () => {
        axios.get(`http://localhost:3001/questions`).then(response => {
          console.log(response.data)
          setQuestions(response.data)
          setLoading(false)
        })
      }
      loadQuestions().catch(console.error)
      if (secureLocalStorage.getItem("key") != null) {
        setAccount(secureLocalStorage.getItem("key"))
      }
    }, [])


    return (
      <div>
        { loading ? <p>Loading...</p> :
      <div className="bg-white py-12">
        <div className="max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-8 lg:max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Trending on ShotChain</h2>
            <p className="mt-2 text-lg leading-8 text-gray-600">
              Answer Questions to earn Bounties!
            </p>
            <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-20">
              {questions.map((post) => (
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
          </div>
        </div>
      </div>
  }
      </div>
    )
  }
  