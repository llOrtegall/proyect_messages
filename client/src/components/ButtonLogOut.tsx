import axios from "axios";
import { Button } from "./ui/button";
import { useAuth } from "@/auth/AuthProvider";
import { useLocation } from "wouter";



export const ButtonLogOut = () => {
  const { setUser } = useAuth()
  const [_, location] = useLocation();

  const handleLogOut = () => {
    axios.get('logout')
      .then(() => {
        console.log('logout');
        setUser(null)
        location("/login")
      })
      .catch((err) => {
        console.log(err);
      })
  }

  return (
    <Button onClick={handleLogOut}>Logout</Button>
  )
}
