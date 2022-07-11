import React, { useState } from "react";


function Button({ Mycomponent, cmpName, indent }) {
    const [currState, setcurrState] = useState([]);

    function buttonClicked() {
        setcurrState(!currState);
        console.log(currState)
    }

    return (
        <div id={cmpName} className={`pl-${indent * 5}`}>
            {currState ?
                <>
                    <button onClick={buttonClicked}>{"<" + cmpName + ">"}</button>
                    {Mycomponent}
                    <button onClick={buttonClicked}>{"<" + cmpName + "/>"}</button>
                </>
                : <button onClick={buttonClicked}>{"<" + cmpName + ">...<" + cmpName + "/>"}</button>}

        </div>
    )
}

export default Button;