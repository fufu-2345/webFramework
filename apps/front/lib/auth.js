import { apiFetch } from "./api";



export const loginUsers = (data) => {
    return apiFetch('login',{
        method: 'POST',
        body: JSON.stringify(data)
        
    });
};


export const meData = async () => {
 
    return await apiFetch("me",{
        method: 'GET',
    });
  
};

export const logoutUsers = () =>{
    return apiFetch('logout',{
        method: 'POST',
    });
};

export const registerUsers = async (data) => {
    return await apiFetch('register',{
        method: 'POST',
        body: JSON.stringify(data),
    });
}


