<div style="text-align: center;">
    <a href="https://github.com/altsmpegado/imos"><img src="utils/images/imos_banner.svg" style="width:100%;"></a>
</div>
<br>
<p align="center">Welcome to the Industry Modular Operating System built on top of <a href="https://www.docker.com/" target="_blank">Docker</a> and powered by <a href="http://electron.atom.io" target="_blank">Electron</a>. Offering integration and deploymenty tools (imoslink), an industry-oriented marketplace (imostore) and a collaborative hub (imoshub). This is a work in a progress a not a final product.</p>


<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#platform">Platform</a> •
  <a href="#how-to-use">How To Use</a> •
</p>

## Key Features

* **Modularity and Synergy**. Choose from a wide range of containerized applications that adapt well to any environment, promoting adaptability and collaboration.
* **Customization**. Optimize automation systems for effectiveness, security, and productivity by selecting tailored commercial apps and dynamically changing system configurations.
* **Integration and Standardization**. Software applications follow a common format through containerization, making integration with different production systems easier.
* **Collaboration within the Community**. Manufacturing businesses and software stakeholders contribute to the IMOS ecosystem by publishing software, exchanging data, and building integrated solutions.
* **Innovation**. Exposure to a wide range of potential customers encourages software vendors to innovate and address manufacturing concerns. Manufacturing organizations benefit from increased effectiveness and quality of operations and regular software updates.
* **Data Feedback Loop**. Applications can return data to the IMOStore, helping software suppliers refine their solutions based on empirical findings.
* **Monetization**. Software companies can generate income and increase visibility by monetizing their apps and services through the IMOStore. Manufacturing companies save money by paying only for the apps they need or even monetizing collected data from industrial processes.

## Platform
Through IMOS and the IMOSlink app, users seamlessly integrate their software applications or acquire solutions from IMOStore within the platform. This integration enables configuration of applications and connection of their execution with intended endpoints. Users can open each application from the home screen and manage their execution with IMOSlink. 
<br>
<br>
IMOS, built on Docker and NodeJS with Electron, facilitates backend and frontend development and modularity, serving as the central orchestrating component for interconnected containers, communicating with and launching other applications based on user input.
<br>
<br>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="utils/images/platform-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="utils/images/platform-light.png">
    <img src="utils/images/platform-light.png">
  </picture>
</p>
<br>
<br>
The IMOSlink app serves as a bridge between Docker and the user, orchestrating installed applications and connecting hardware endpoints to software applications. Docker's integration, distribution, and modularity capabilities make it ideal for IMOS, ensuring seamless compatibility and efficient management of containerized applications. 
<br>
<br>
IMOStore and IMOShub are the other two modules within the IMOS platform, forming its core. IMOStore allows users to explore and acquire applications or submit their own for review and distribution. IMOShub facilitates collaboration, knowledge sharing, and resource exchange among users from different backgrounds and roles. 
<br>
<br>
These apps are hosted on IMOS servers, using Express microservices for managing user information, authentication, marketplace functionalities, and community posts. Data generated from user profiles, marketplace application distribution, and community interactions is stored in separate MongoDB clusters.

## Requirements

## How To Use

