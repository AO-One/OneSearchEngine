const businessNames = "Google, YouTube, Facebook, Amazon, Wikipedia, Reddit, Netflix, Twitter, Instagram, LinkedIn, eBay, BBC, NHS, Microsoft, Apple, GitHub, Stack Overflow, Twitch, DisneyPlus, Spotify"; // Paste your 200 names here
const namesArray = businessNames.split(", ");

const autoIndex = namesArray.map(name => {
    return {
        name: name,
        category: "General", // You can update these later
        link: `https://www.${name.toLowerCase().replace(/\s+/g, '')}.com`,
        keywords: [name.toLowerCase(), "service", "oneos"],
        safe: true
    };
});

console.log(JSON.stringify(autoIndex, null, 2));