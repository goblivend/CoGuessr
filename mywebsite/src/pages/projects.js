import React from "react";
import Project from "../components/project";
import CMTAL from "../assets/CodeMeToAfterlife.png"
import Button from "./button";

function Projects() {
    return (
        <div >
            <Button indent={2} Mycomponent={<Project name="CodeMeToAfterlife" image={CMTAL} category="Game, Unity" link="https://codemetoafterlife.ml/" description="A project made during my second semester of school at EPITA" />} cmpName="CodeMeToAfterlife" />
            <Button indent={2} Mycomponent={<Project name="CodeMeToAfterlife" image={CMTAL} category="Game, Unity" link="https://codemetoafterlife.ml/" description="A project made during my second semester of school at EPITA" />} cmpName="CodeMeToAfterlife" />
            <Button indent={2} Mycomponent={<Project name="CodeMeToAfterlife" image={CMTAL} category="Game, Unity" link="https://codemetoafterlife.ml/" description="A project made during my second semester of school at EPITA" />} cmpName="CodeMeToAfterlife" />
            <Button indent={2} Mycomponent={<Project name="CodeMeToAfterlife" image={CMTAL} category="Game, Unity" link="https://codemetoafterlife.ml/" description="A project made during my second semester of school at EPITA" />} cmpName="CodeMeToAfterlife" />
            <Button indent={2} Mycomponent={<Project name="CodeMeToAfterlife" image={CMTAL} category="Game, Unity" link="https://codemetoafterlife.ml/" description="A project made during my second semester of school at EPITA" />} cmpName="CodeMeToAfterlife" />
        </div>
    );
}
export default Projects;