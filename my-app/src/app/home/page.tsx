'use client'
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

const Home = () => {
    const [data, setData] = useState([]) as any[];
    const routes = ['api/klient',  'api/historia_zamowien', 'api/konta', 'api/koszyk', 'api/platnosci', 'api/zamowienia', 'api/audiobook',];
        
    const fetch = async (route: string) => {
        await axios.get(`/${route}`)
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
                {routes.map((route, index) => (
                    <Button key={index} onClick={() => fetch(route)} className="mt-4 mr-2">
                        {route.replace('api/', '')}
                    </Button>
                ))}
                {data.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mt-4">Data</h2>
                        <ul>
                            {data.map((item:any, index:number) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
