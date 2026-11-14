export type AdoptionStatus='pending'|'approved'|'rejected'|'adopted'|'paused';
export type AdoptionRequestStatus='pending'|'accepted'|'declined';
export type AdoptionListing={
 id:number;petName:string;type:'Dog'|'Cat';breed:string;age:string;gender:'Male'|'Female';location:string;
 vaccination:string;health:string;reason:string;photos:string[];photoTitles:string[];
 ownerKind:'individual'|'rescue';ownerName:string;ownerEmail:string;ownerPhone:string;
 organizationName:string;organizationId:string;organizationVerified:boolean;
 status:AdoptionStatus;createdAt:string;updatedAt:string;sample?:boolean;
};
export type AdoptionRequest={
 id:number;listingId:number;applicantName:string;applicantEmail:string;applicantPhone:string;
 household:string;petExperience:string;carePlan:string;status:AdoptionRequestStatus;createdAt:string;
};
export type PublicAdoptionListing=Omit<AdoptionListing,'ownerName'|'ownerEmail'|'ownerPhone'|'organizationId'>&{sample?:boolean};
