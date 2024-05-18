<div style="text-align: center;">
    <a href="https://github.com/altsmpegado/imos"><img src="utils/images/imos_banner.svg" style="width:100%;"></a>
</div>
<br>
<p align="center">Welcome to the Industry Modular Operating System built on top of <a href="https://www.docker.com/" target="_blank">Docker</a> and powered by <a href="http://electron.atom.io" target="_blank">Electron</a>. Offering integration and deploymenty tools (imoslink), an industry-oriented marketplace (imostore) and a collaborative hub (imoshub).</p>

<p align="center">
  <a href="https://badge.fury.io/js/electron-markdownify">
    <img src="https://badge.fury.io/js/electron-markdownify.svg"
         alt="Gitter">
  </a>
  <a href="https://gitter.im/amitmerchant1990/electron-markdownify"><img src="https://badges.gitter.im/amitmerchant1990/electron-markdownify.svg"></a>
  <a href="https://saythanks.io/to/bullredeyes@gmail.com">
      <img src="https://img.shields.io/badge/SayThanks.io-%E2%98%BC-1EAEDB.svg">
  </a>
  <a href="https://www.paypal.me/AmitMerchant">
    <img src="https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&amp;style=flat">
  </a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#platform">Platform</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#download">Download</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://raw.githubusercontent.com/amitmerchant1990/electron-markdownify/master/app/img/markdownify.gif)

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

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/amitmerchant1990/electron-markdownify

# Go into the repository
$ cd electron-markdownify

# Install dependencies
$ npm install

# Run the app
$ npm start
```

> **Note**
> If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.


## Download

You can [download](https://github.com/amitmerchant1990/electron-markdownify/releases/tag/v1.2.0) the latest installable version of Markdownify for Windows, macOS and Linux.

## Credits

This software uses the following open source packages:

- [Electron](http://electron.atom.io/)
- [Node.js](https://nodejs.org/)
- [Marked - a markdown parser](https://github.com/chjj/marked)
- [showdown](http://showdownjs.github.io/showdown/)
- [CodeMirror](http://codemirror.net/)
- Emojis are taken from [here](https://github.com/arvida/emoji-cheat-sheet.com)
- [highlight.js](https://highlightjs.org/)

## Related

[markdownify-web](https://github.com/amitmerchant1990/markdownify-web) - Web version of Markdownify

## Support

<a href="https://www.buymeacoffee.com/5Zn8Xh3l9" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/purple_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

<p>Or</p> 

<a href="https://www.patreon.com/amitmerchant">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## You may also like...

- [Pomolectron](https://github.com/amitmerchant1990/pomolectron) - A pomodoro app
- [Correo](https://github.com/amitmerchant1990/correo) - A menubar/taskbar Gmail App for Windows and macOS

## License

MIT

---

> GitHub [@amitmerchant1990](https://github.com/altsmpegado) &nbsp;&middot;&nbsp;
> Twitter [@amit_merchant](https://twitter.com/amit_merchant)

export GRAFANA_PORT="3001:3000"
export KSQLDBSERVER_PORT="8088:8088"
export SCHEMAREG_PORT="8081:8081"
export CONTROLCENTER_PORT="9021:9021"
export KAFKACNCT_PORT="8083:8083"
export BROKER_PORT1="9092:9092"
export BROKER_PORT2="9101:9101"
export ZOOKEEPER_PORT="2181:2181"
export RESTPROXY_PORT="8082:8082"
export CONNECT_PORT="8020:8020"
docker compose -p imos-datavisapp up -d