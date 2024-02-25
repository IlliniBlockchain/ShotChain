'use client'
import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import secureLocalStorage from 'react-secure-storage'
import { useState, useEffect } from 'react'
import Web3 from 'web3'
import axios from 'axios';
import Swal from 'sweetalert2';
import AWS from "aws-sdk";


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}




export default function Navbar() {

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

  const [navigation, setNavigation] = useState([
    { name: 'Home', href: '/', current: true, url: 'http://localhost:3000/' },
    { name: 'Create Post', href: '/create', current: false, url: 'http://localhost:3000/create' },
  ])
  const [account, setAccount] = useState({ name: '', address: '', imageURL: '' });
  useEffect(() => {
    const loadWeb3 = async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const temp = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (temp) {
          console.log(temp[0])
          axios.get(`http://localhost:3001/user/${temp[0]}`)
            .then(response => {
              console.log(response.data);
              if (!response.data || Object.keys(response.data).length === 0) {
                // Fire SweetAlert if empty
                Swal.fire({
                  title: "Enter your name to register ",
                  inputAttributes: {
                    autocapitalize: "off"
                  },
                  showCancelButton: true,
                  confirmButtonText: "Submit",
                  showLoaderOnConfirm: true,
                  html: `
                  <input type="text" id="swal-input1" class="swal2-input" placeholder="Text">
                  <input type="file" id="swal-input2" class="swal2-input">
                `,
                  preConfirm: async () => {
                    try {
                      const text = document.getElementById('swal-input1').value;
                      let file = document.getElementById('swal-input2').files[0];
                      await uploadFile(file).then(response => {
                        console.log(response)
                        axios.post('http://localhost:3001/user', { name: text, address: temp[0], image: file.name ? 'https://shotchain.s3.amazonaws.com/' + file.name : '/pfps/penguin.jpeg' })
                          .then(resp => {
                            console.log('User created:', resp.data);
                            // Optionally, clear the form or give user feedback
                            setAccount({
                              name: text,
                              address: temp[0],
                              image: file.name ? 'https://shotchain.s3.amazonaws.com/' + file.name : '/pfps/penguin.jpeg',
                            });
                          })
                          .catch(error => {
                            console.error('Error creating user:', error);
                          });
                      })
                    } catch (error) {
                      Swal.showValidationMessage(`
                      Request failed: ${error}
                    `);
                    }
                  },
                  allowOutsideClick: () => !Swal.isLoading()
                }).then((result) => {
                  console.log(result)
                });
              } else {
                // Handle your data
                setAccount({
                  name: response.data.name,
                  address: response.data.address,
                  imageURL: response.data.image,
                });
              }
            })
            .catch(error => {
              console.error('Error fetching data:', error);
              // Optionally, handle errors or fire another SweetAlert for errors
            });
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      }
      // Non-dapp browsers...
      else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
      }
    }
    loadWeb3().catch(console.error)
  }, [])


  return (
    <Disclosure as="nav" className="sticky-nav bg-gray-800">
      {({ open }) => (
        <>
          <div className="">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2">
                  Shotchain
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          window.location.href == item.url ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium'
                        )}
                        aria-current={window.location.href == item.url ? 'page' : undefined}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 text-white">
                {account.name}

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={account.imageURL}
                        alt=""
                      />
                    </Menu.Button>
                  </div>
                </Menu>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}