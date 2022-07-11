import React from "react";

function Project({ name, image, category, description, link }) {
    return (
        <div className="flex justify-evenly py-2 place-content-center">
            <div className="flex bg-gradient-to-tr font-semibold from-blue-500 to-red-500 text-gray-200 px-5 py-3 w-11/12 h-min">
                <img src={image} alt={name} width="100" height="100" className="align-left"></img>
                <div className="justify-items-center  py-8">

                    <a href={link} target="_blank" rel="noreferrer" >{name}</a>
                    <span >{category}</span>
                    <span >{description}</span>
                </div>
            </div>
        </div>
    );
}
export default Project;