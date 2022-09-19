export const getTotalProjects = async (solutionPath: string) => {
    var totalProjects = 0
    const slnFileContents = await window.backend.getFileContents(solutionPath);
    var lines = slnFileContents.split("\n");
    const pattern = /Project\("\{.*\}"\)/;
    for (const line of lines) {
        if (line.match(pattern) !== null) totalProjects+=1;
    }
    return totalProjects;
}