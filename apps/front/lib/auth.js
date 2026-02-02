import { apiFetch } from "./api";



export const loginUsers = (data) => {
    return apiFetch('api/login',{
        method: 'POST',
        body: JSON.stringify(data)
        
    });
};


export const meData = async () => {
 
    return await apiFetch("api/me",{
        method: 'GET',
    });
  
};

export const logoutUsers = () =>{
    return apiFetch('api/logout',{
        method: 'POST',
    });
};

export const registerUsers = async (data) => {
    return await apiFetch('api/register',{
        method: 'POST',
        body: JSON.stringify(data),
    });
}


