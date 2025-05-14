import axios from "axios";
import { Button } from "./ui/button";
import { useAuth } from "@/auth/AuthProvider";



export const ButtonLogOut = () => {
    const { setUser } = useAuth()

    const handleLogOut = () => {
        axios.get('logout')
            .then(() => {
                console.log('logout');
                setUser(null)
            })
            .catch((err) => {
                console.log(err);
            })
    }

    return (
        <Button onClick={handleLogOut}>Logout</Button>
    )
}
