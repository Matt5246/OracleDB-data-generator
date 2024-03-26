'use client'
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

const Home = () => {
    const [data, setData] = useState([]) as any[];
    const fetch = async () => {
        await axios.get('/api/oracle')
            .then(response => {
                setData(response.data);
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }
    return (
        <div className="flex justify-center items-center h-screen">
            <div>
                <h1 className="text-4xl font-bold">Home</h1>
                <p className="text-lg">Fetch the data from database!</p>
                <Button onClick={fetch} className="mt-4">fetch</Button>
                {
                    data.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold mt-4">Data</h2>
                            <ul>
                                {
                                    data.map((item:any, index:number) => (
                                        <li key={index}>{item}</li>
                                    ))
                                }
                            </ul>
                        </div>
                    )   
                }
                    
            </div>
        </div>
    );
};

export default Home;