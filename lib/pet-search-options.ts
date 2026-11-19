const dogBreeds=['Rajapalayam','Chippiparai','Kanni','Kombai','Labrador Retriever','Golden Retriever','German Shepherd','Indian Pariah (Indie)','Beagle','Shih Tzu','Pomeranian','Pug','Rottweiler','Doberman','Boxer','Cocker Spaniel','Dachshund','Siberian Husky','French Bulldog','Great Dane','Border Collie','Lhasa Apso','Indian Spitz','Chihuahua','Toy Poodle','Maltese','Chow Chow','Dalmatian','Mudhol Hound'];
const catBreeds=['Domestic Shorthair','Persian','Siamese','Maine Coon','Bengal','Ragdoll','British Shorthair','Himalayan','Russian Blue','Sphynx','Abyssinian','Scottish Fold','Bombay','Turkish Angora','Indie'];
export function breedsFor(type:string){return type==='Dog'?dogBreeds:type==='Cat'?catBreeds:Array.from(new Set([...dogBreeds,...catBreeds])).sort((a,b)=>a.localeCompare(b))}

export type CityOption={name:string;aliases?:string[]};
export const indianCities:CityOption[]=[
 {name:'Chennai',aliases:['Madras']},{name:'Bengaluru',aliases:['Bangalore']},{name:'Mumbai',aliases:['Bombay']},{name:'Hyderabad'},{name:'Delhi',aliases:['New Delhi']},{name:'Coimbatore'},{name:'Madurai'},{name:'Tiruchirappalli',aliases:['Trichy']},{name:'Tirunelveli'},{name:'Salem'},{name:'Erode'},{name:'Vellore'},{name:'Thoothukudi',aliases:['Tuticorin']},{name:'Tiruppur'},{name:'Dindigul'},{name:'Thanjavur'},{name:'Kanchipuram'},{name:'Nagercoil'},{name:'Hosur'},{name:'Puducherry',aliases:['Pondicherry']},{name:'Kochi',aliases:['Cochin']},{name:'Thiruvananthapuram',aliases:['Trivandrum']},{name:'Kozhikode',aliases:['Calicut']},{name:'Thrissur'},{name:'Mysuru',aliases:['Mysore']},{name:'Mangaluru',aliases:['Mangalore']},{name:'Pune'},{name:'Nagpur'},{name:'Nashik'},{name:'Ahmedabad'},{name:'Surat'},{name:'Vadodara'},{name:'Jaipur'},{name:'Udaipur'},{name:'Jodhpur'},{name:'Kolkata',aliases:['Calcutta']},{name:'Bhubaneswar'},{name:'Cuttack'},{name:'Guwahati'},{name:'Lucknow'},{name:'Kanpur'},{name:'Varanasi'},{name:'Agra'},{name:'Indore'},{name:'Bhopal'},{name:'Patna'},{name:'Ranchi'},{name:'Chandigarh'},{name:'Dehradun'},{name:'Visakhapatnam',aliases:['Vizag']},{name:'Vijayawada'},{name:'Guntur'},{name:'Tirupati'},{name:'Kurnool'},{name:'Amritsar'},{name:'Ludhiana'},{name:'Jalandhar'},{name:'Shimla'},{name:'Srinagar'}
];
export function citySuggestions(value:string){const query=value.trim().toLocaleLowerCase();if(!query)return indianCities.slice(0,8);return indianCities.filter(city=>city.name.toLocaleLowerCase().includes(query)||(city.aliases||[]).some(alias=>alias.toLocaleLowerCase().includes(query))).slice(0,8)}
export function canonicalCity(value:string){const query=value.trim().toLocaleLowerCase();const found=indianCities.find(city=>city.name.toLocaleLowerCase()===query||(city.aliases||[]).some(alias=>alias.toLocaleLowerCase()===query));return found?.name||value.trim()}

// Curated neighbourhood suggestions. Users can add any locality that is not listed.
const cityAreas:Record<string,string[]>={
 Chennai:['Adyar','Anna Nagar','Ashok Nagar','Avadi','Besant Nagar','Chromepet','Egmore','Guindy','Kelambakkam','Kilpauk','Kodambakkam','Kolathur','Madhavaram','Medavakkam','Mylapore','Navalur','Nungambakkam','Pallavaram','Perambur','Perungudi','Porur','Sholinganallur','Tambaram','T. Nagar','Thiruvanmiyur','Velachery'],
 Bengaluru:['Banashankari','Basavanagudi','Bellandur','Electronic City','HSR Layout','Indiranagar','Jayanagar','JP Nagar','Koramangala','Malleshwaram','Marathahalli','Whitefield'],
 Hyderabad:['Ameerpet','Gachibowli','HITEC City','Jubilee Hills','Kondapur','Kukatpally','Madhapur','Miyapur','Secunderabad'],
 Mumbai:['Andheri','Bandra','Borivali','Chembur','Dadar','Goregaon','Juhu','Powai','Thane'],
 Delhi:['Dwarka','Hauz Khas','Karol Bagh','Lajpat Nagar','Mayur Vihar','Rohini','Saket','Vasant Kunj'],
 Coimbatore:['Gandhipuram','Peelamedu','RS Puram','Saibaba Colony','Saravanampatti','Singanallur','Town Hall'],
 Madurai:['Anna Nagar','Goripalayam','KK Nagar','Simmakkal','Tallakulam','Thirunagar'],
 Puducherry:['Ariyankuppam','Lawspet','Muthialpet','Rainbow Nagar','White Town'],
 Kochi:['Aluva','Edappally','Fort Kochi','Kakkanad','Kalamassery','Thrippunithura'],
 Pune:['Aundh','Baner','Hadapsar','Hinjawadi','Kothrud','Viman Nagar'],
 Kolkata:['Ballygunge','Dum Dum','Howrah','New Town','Salt Lake'],
 Ahmedabad:['Bodakdev','Maninagar','Navrangpura','Satellite','Thaltej'],
 Visakhapatnam:['Dwaraka Nagar','Gajuwaka','Madhurawada','MVP Colony','Seethammadhara']
};
export function areasForCity(city:string){const canonical=canonicalCity(city);return cityAreas[canonical]||[]}
