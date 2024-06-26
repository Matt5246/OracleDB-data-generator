'use client'
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input";

const Home = () => {
    const routes = ['api/klient', 'api/historia_zamowien', 'api/konta', 'api/koszyk', 'api/audiobook', 'api/magazyn', 'api/ksiazki', 'api/komiksy', 'api/platnosci', 'api/zamowienia'];
    const routesStart = ['api/klient', 'api/historia_zamowien', 'api/konta', 'api/platnosciZamowienia', 'api/koszyk', 'api/audiobook', 'api/magazyn', 'api/ksiazki', 'api/komiksy'];
    const { toast }: any = useToast()
    const [rows, setRows] = useState(1000);
    const fetch = async (route: string, numberOfRows: number) => {
        await axios.post(`/${route}`, { numberOfRows })
            .then(response => {
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
    const runAllRoutes = async () => {
        for (const route of routesStart) {
            await fetch(route, rows || 10);
        }
    }
    return (
        <div className="flex my-16 h-full ">
            <div className="mx-10 text-lg" >
                <h1 className="text-4xl font-bold">Home page oracledb example data fetch symulator</h1>
                
                <p className="my-4">Pick the number of rows</p>
                <Input type="number" className="w-[150px]" value={rows} onChange={(e) => setRows(parseInt(e.target.value))} />
                
                <div className="my-4">
                    <p>create new database</p>
                    <Button onClick={() => fetch('api/refreshDatabase', 1)} disabled className="mt-4 mr-2">Run</Button>
                </div>
                <p>fill all tables</p>
                <Button onClick={runAllRoutes} className="mt-4 mr-2 mb-3">Run All Routes</Button>
                <p >Fetch the rows to database!</p>
                {routes.map((route, index) => (
                    <Button key={index} onClick={() => fetch(route, rows)} className="mt-4 mr-2">
                        {route.replace('api/', '')}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default Home;
