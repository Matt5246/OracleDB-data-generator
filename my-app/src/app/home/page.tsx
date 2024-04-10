'use client'
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast"

const Home = () => {
    const [data, setData] = useState([]) as any[];
    const routes = ['api/klient',  'api/historia_zamowien', 'api/konta', 'api/koszyk', 'api/platnosci', 'api/zamowienia', 'api/audiobook','api/platnosciZamowienia', 'api/koszyk', 'api/magazyn', 'api/ksiazki', 'api/komiksy'];
    const { toast } : any = useToast()
        
    const fetch = async (route: string) => {
        await axios.post(`/${route}`, { numberOfRows: 15})
            .then(response => {
                setData(response.data);
                console.log(response.data);
                toast({
                    title: "Database up to date",
                    description: response.data ? response.data.message : "Error fetching data",
                  })
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
        <div className="flex my-16 h-screen ">
            <div className="mx-10">
                <h1 className="text-4xl font-bold">Home</h1>
                <div className="my-4">
                    <p>create new database and insert 100 rows of data into all tables</p>
                    <Button onClick={() => fetch('api/refreshDatabase')} className="mt-4 mr-2">Run</Button>
                </div>
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
