import { GoogleGenAI, Type } from "@google/genai";
import type { User, Venue, CallSheetTimingItem, Event } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder for development. In a real environment, the key should be set.
  console.warn("API_KEY environment variable not set. Using a placeholder. AI features will not work.");
  process.env.API_KEY = "YOUR_API_KEY_HERE";
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface Context {
  users: User[];
  venues: Venue[];
  events: Event[];
  bandName: string;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            description: "The action to perform. Either 'CREATE_EVENT' for planning an event, 'QUERY' for answering a question, or 'SUMMARIZE' for generic summarization.",
        },
        event: {
            type: Type.OBJECT,
            description: "Event details, only if action is 'CREATE_EVENT'.",
            properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['rehearsal', 'show', 'meeting'] },
                venue: { type: Type.STRING },
                start: { type: Type.STRING, description: "Full ISO 8601 date-time string in Europe/Brussels timezone." },
                end: { type: Type.STRING, description: "Full ISO 8601 date-time string in Europe/Brussels timezone." },
                attendees: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            firstName: {
                                type: Type.STRING,
                                description: "First name of the person attending."
                            },
                            role: {
                                type: Type.STRING,
                                description: "The specific role for this person for this event (e.g., 'Lead Vocals', 'Gitaar', 'FOH')."
                            },
                            fee: {
                                type: Type.NUMBER,
                                description: "The fee for this person for this event, in EURO."
                            }
                        },
                        required: ['firstName']
                    }
                },
            },
        },
        summary: {
            type: Type.STRING,
            description: "A text summary, only if action is 'QUERY' or 'SUMMARIZE'.",
        }
    }
};

export async function getAiPlanningResponse(prompt: string, context: Context): Promise<any> {
    const today = new Date().toLocaleString('nl-BE', { timeZone: 'Europe/Brussels' });

    const eventContextString = context.events.slice(0, 20).map(e => { // Limit context size
        const venue = context.venues.find(v => v.id === e.venueId);
        const assignments = e.assignments.map(a => context.users.find(u => u.id === a.userId)?.firstName).filter(Boolean).join(', ');
        return `- Event: "${e.title}" op ${e.start.toLocaleDateString('nl-BE')} van ${e.start.toLocaleTimeString('nl-BE')} tot ${e.end.toLocaleTimeString('nl-BE')} in ${venue?.name || 'onbekende locatie'}. Aanwezigen: ${assignments || 'N/A'}.`;
    }).join('\n');


    const systemInstruction = `
        Je bent StageFlow AI, een assistent voor het plannen van evenementen voor de band/artiest: ${context.bandName}.
        Je taal is Nederlands (Vlaams). De huidige datum en tijd is ${today}. De tijdzone is Europe/Brussels.
        Gebruik de verstrekte context over gebruikers, locaties en evenementen. Je kennis is beperkt tot de verstrekte context.

        Analyseer de prompt van de gebruiker:
        1. Als de gebruiker een evenement wil plannen (bv. "plan een repetitie", "boek een show"), identificeer de details en antwoord met een JSON-object dat voldoet aan het opgegeven schema met action 'CREATE_EVENT'. Bereken de exacte datum en tijd. Wees precies. 'Volgende vrijdag' vanaf maandag 1 juli 2024 is vrijdag 5 juli 2024.
        2. Identificeer de specifieke rol en vergoeding (fee) van elke persoon als deze wordt genoemd (bv. "met Merel op zang voor 500 euro"). Voeg deze toe aan het 'attendees' object. Als er geen rol wordt genoemd, laat je het rolveld weg.
        3. Als de gebruiker een vraag stelt over de planning, personen of locaties (bv. "wie is vrij volgende dinsdag?", "wat is het nummer van Flor Boey?", "wanneer is de show in het Sportpaleis?"), zoek het antwoord in de verstrekte context. Antwoord met action 'QUERY' en een behulpzame samenvatting in het 'summary' veld.
        4. Als de prompt algemeen is of een samenvatting vraagt, gebruik action 'SUMMARIZE'.
        
        Context voor ${context.bandName}:
        - Beschikbare personen: ${context.users.map(u => `${u.firstName} (${u.role}, tel: ${u.phone || 'N/A'})`).join('; ')}
        - Beschikbare locaties (venues): ${context.venues.map(v => v.name).join(', ')}
        - Geplande evenementen (een selectie):
        ${eventContextString}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API call failed:", error);
        // Fallback for when JSON parsing fails or API returns an error
        return { action: 'SUMMARIZE', summary: 'Sorry, ik kon je verzoek niet verwerken. Probeer het anders te formuleren.' };
    }
}

const timingResponseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            time: { type: Type.STRING, description: "Time in HH:mm format." },
            description: { type: Type.STRING, description: "Description of the activity, without the duration." },
            duration: { type: Type.NUMBER, description: "Optional duration of the activity in minutes."}
        },
        required: ['time', 'description']
    }
};

export async function getAiTimingResponse(
    eventDetails: { eventType: string, title: string, startTime: Date, endTime: Date }, 
    exampleTimings: Omit<CallSheetTimingItem, 'id'>[][]
): Promise<any> {
    const duration = (eventDetails.endTime.getTime() - eventDetails.startTime.getTime()) / (1000 * 60); // duration in minutes
    
    const systemInstruction = `
        Je bent StageFlow AI, een assistent voor het plannen van evenementen.
        Je taak is om een realistisch en logisch tijdschema (timing) te genereren voor een evenement.
        Het evenement is een '${eventDetails.eventType}' genaamd '${eventDetails.title}'.
        Het start om ${eventDetails.startTime.toLocaleTimeString('nl-BE', { timeZone: 'Europe/Brussels' })} en eindigt om ${eventDetails.endTime.toLocaleTimeString('nl-BE', { timeZone: 'Europe/Brussels' })}, met een totale duur van ${duration} minuten.
        
        Baseer je schema op de start- en eindtijd. Zorg voor logische stappen zoals load-in, soundcheck, diner, showtime, en einde show.
        De 'showtime' moet binnen de gegeven start- en eindtijd vallen.

        Gebruik je kennis van evenementenproductie en de voorbeelden om realistische duren voor elke stap in te schatten en geef deze op in het 'duration' veld in minuten.
        - Een 'show' duurt doorgaans 85 minuten.
        - Een 'change-over + linecheck' duurt ongeveer 40 minuten.
        - Een 'diner' duurt ongeveer 60 minuten.
        Voeg de duur NIET toe aan de beschrijving.
        
        Hier zijn enkele voorbeelden van goede tijdschema's ter inspiratie:
        ${JSON.stringify(exampleTimings, null, 2)}
        
        Genereer een nieuw, passend schema voor het huidige evenement. Antwoord ALLEEN met een JSON-array die voldoet aan het schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Genereer een tijdschema met duren in minuten voor een ${eventDetails.eventType} genaamd "${eventDetails.title}" van ${eventDetails.startTime.getHours()}:${String(eventDetails.startTime.getMinutes()).padStart(2,'0')} tot ${eventDetails.endTime.getHours()}:${String(eventDetails.endTime.getMinutes()).padStart(2,'0')}.`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: timingResponseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API call for timing failed:", error);
        return null;
    }
}


const colorResponseSchema = {
    type: Type.OBJECT,
    properties: {
        hexColor: { 
            type: Type.STRING,
            description: "The dominant vibrant color from the image as a 7-character hexadecimal string (e.g., '#RRGGBB')." 
        },
    }
};

export async function getThemeColorFromImage(base64Data: string, mimeType: string): Promise<string | null> {
    const systemInstruction = `
        You are an expert UI/UX design assistant. Your task is to analyze the provided image (a band logo) and extract its most dominant or representative color.
        This color should be suitable as a primary theme color for an application.
        - Avoid black, white, or dull grays unless they are the absolute only option.
        - Prioritize vibrant, characteristic colors from the logo.
        - Return the color as a single 7-character hexadecimal string (e.g., '#RRGGBB').
        - Respond ONLY with a JSON object that conforms to the specified schema.
    `;

    try {
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: colorResponseSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result.hexColor && /^#[0-9A-F]{6}$/i.test(result.hexColor)) {
            return result.hexColor;
        }
        return null;

    } catch (error) {
        console.error("Gemini API call for theme color failed:", error);
        return null;
    }
}

export async function getCompanyDetailsByVat(vatNumber: string): Promise<any> {
    const systemInstruction = `
      You are a business data retrieval assistant. Your task is to find official company registration details based on a provided VAT number using Google Search.
      - Use the search tool to find the official registration data for the company.
      - Extract the Company Name, Full Address (street and number), City, Postal Code, and Country.
      - Respond ONLY with a JSON object containing these fields: { "companyName": "...", "address": "...", "postalCode": "...", "city": "...", "country": "..." }.
      - If you cannot find the information, respond with an empty JSON object {}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find company details for VAT number: "${vatNumber}"`,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

        let text = response.text.trim();

        // Attempt to extract JSON from markdown or plain text
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            text = jsonMatch[2];
        } else {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
        }

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response for VAT:", parseError);
            console.error("Original text from model:", response.text);
            return { error: "Kon geen gestructureerde data uit het antwoord halen." };
        }

    } catch (apiError) {
        console.error("Gemini API call for VAT validation failed:", apiError);
        return { error: "Kon geen details vinden voor dit BTW-nummer." };
    }
}

export async function getAiEventDetailsFromSearch(eventName: string): Promise<any> {
    const systemInstruction = `
      Je bent een expert evenementen productie-assistent.
      Je taak is om via Google Search de officiële informatie te vinden voor de gegeven evenementnaam.
      Focus op de officiële website van het evenement of de locatie, niet op ticketverkopers.
      Extraheer de volgende details:
      - Naam van de locatie (venueName)
      - Volledig adres van de locatie (venueAddress)
      - Startdatum en -tijd (startDate, als ISO 8601 string)
      - Einddatum en -tijd (endDate, als ISO 8601 string)
      - De volledige line-up, inclusief tijden indien beschikbaar (lineup)
      - De URL van de officiële website waar je de info vond (websiteUrl)
      
      Antwoord met een JSON-object. Als je specifieke informatie niet kunt vinden, laat dan het overeenkomstige veld weg of null.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Vind de details voor het evenement: "${eventName}"`,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });
        
        let text = response.text.trim();
        
        // Attempt to extract JSON from markdown or plain text
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            text = jsonMatch[2];
        } else {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
        }
        
        try {
            const parsedJson = JSON.parse(text);

            // Also try to get the source URL from grounding metadata as a fallback
            if (!parsedJson.websiteUrl) {
                const sourceUri = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;
                if (sourceUri) {
                    parsedJson.websiteUrl = sourceUri;
                }
            }
            return parsedJson;

        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response for event search:", parseError);
            console.error("Original text from model:", response.text);
            return { error: "Kon geen gestructureerde data uit het antwoord halen." };
        }

    } catch (apiError) {
        console.error("Gemini API call for event search failed:", apiError);
        return { error: "Kon geen details vinden voor dit evenement." };
    }
}


const communicationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { 
            type: Type.STRING,
            description: "Een beknopte en duidelijke onderwerpregel voor de e-mail." 
        },
        body: {
            type: Type.STRING,
            description: "De volledige, goed opgemaakte tekst van de e-mail, met correcte aansprekingen en afsluitingen."
        }
    }
};

export async function getAiCommunicationDraft(
    promptType: 'venueConfirmation' | 'artistReminder',
    event: Event,
    context: { venue?: Venue, users: User[], bandName: string, managerName: string }
): Promise<{ subject: string; body: string } | null> {
    
    const eventDate = event.start.toLocaleString('nl-BE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Brussels' });

    let systemInstruction = `
        Je bent StageFlow AI, een assistent voor een bandmanager. Je stelt professionele en vriendelijke e-mails op in het Nederlands.
        Je antwoord moet ALTIJD een JSON-object zijn dat voldoet aan het opgegeven schema.
    `;
    
    let userPrompt = '';

    if (promptType === 'venueConfirmation') {
        systemInstruction += `
            Stel een e-mail op voor de locatie (${context.venue?.name || 'de locatie'}) om de details van een opkomende show te bevestigen.
            Wees professioneel en beknopt. Vraag om een bevestiging van de gemaakte afspraken.
            Sluit de e-mail af met: "Met vriendelijke groeten,\n${context.managerName}\nBandmanager ${context.bandName}"
        `;
        userPrompt = `
            Bevestig de show voor band "${context.bandName}" genaamd "${event.title}" op ${eventDate}.
            Locatie: ${context.venue?.name}, ${context.venue?.address}.
            Vermeld dat de technische en hospitality riders reeds zijn doorgestuurd en vraag of alles in orde is.
        `;
    } else if (promptType === 'artistReminder') {
        const attendees = event.assignments.map(a => context.users.find(u => u.id === a.userId)?.firstName).filter(Boolean).join(', ');
        const timingDetails = event.callSheet?.timing?.map(t => `- ${t.time}: ${t.description}${t.duration ? ` (${t.duration}')` : ''}`).join('\n');

        systemInstruction += `
            Stel een korte, vriendelijke herinnering op voor de artiesten en crew.
            Het moet duidelijk de belangrijkste informatie bevatten: wat, wanneer, waar, en het schema.
            Begin de e-mail ALTIJD met "Beste team,".
            Structureer de body van de e-mail met duidelijke paragrafen en witruimte. Gebruik lijsten met een koppelteken (-) voor opsommingen zoals het tijdschema.
            Zorg voor een professionele en overzichtelijke opmaak. 
            Sluit de e-mail ALTIJD af met: "Met vriendelijke groeten,\n${context.managerName}"
        `;
        userPrompt = `
            Stel een herinnering op voor een ${event.type} voor de band "${context.bandName}".
            
            Belangrijkste details:
            - Event: "${event.title}"
            - Datum: ${event.start.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            - Call time (starttijd): ${event.start.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
            - Locatie: ${context.venue?.name}, ${context.venue?.address}
            - Aanwezigen: ${attendees}
            ${timingDetails ? `\n- Tijdschema:\n${timingDetails.replace(/^-/gm, '    -')}` : ''}
            
            Vat deze details samen in een duidelijke, vriendelijke e-mail. Sluit af met een positieve noot.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: communicationResponseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API call for communication draft failed:", error);
        return null;
    }
}

const logoResponseSchema = {
    type: Type.OBJECT,
    properties: {
        logoUrl: { 
            type: Type.STRING,
            description: "The direct URL to a high-quality, official band logo image." 
        },
    }
};

export async function getLogoForBand(bandName: string): Promise<{ logoUrl: string } | null> {
    const systemInstruction = `
      You are an expert brand asset finder. Your task is to find an official logo for a music band using Google Search.
      - Prioritize official band websites, verified social media profiles (Facebook, Instagram), or reputable sources like Wikipedia or Spotify.
      - Find a direct URL to a high-quality image (e.g., PNG, SVG, JPG). Avoid URLs to web pages, only direct image links.
      - Respond ONLY with a JSON object that conforms to the specified schema: { "logoUrl": "..." }.
      - If no suitable logo is found, respond with an empty JSON object {}.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find an official logo URL for the band: "${bandName}"`,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: logoResponseSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result.logoUrl) {
            return result;
        }
        return null;
        
    } catch (apiError) {
        console.error("Gemini API call for band logo failed:", apiError);
        return null;
    }
}
