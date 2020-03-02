
// I would bust this out into a generic reusable utility function to reverse the keys and values
const reverseMappings = (mapping: SubstitutionMapping): SubstitutionMapping => {        
    let newArray = [];
    
    (mapping as number[]).forEach((value, index) => {        
        // currently assumes all values are unique
        // assert that they are?

        newArray.push((mapping as number[]).indexOf(index));    
    });

    return newArray;
}


interface SubstitutionMapping {
    readonly [index: number]: number
}


class Rotor {
    private readonly startingPosition: number;
    private readonly currentPosition: number;
    private readonly mappings: SubstitutionMapping;
    private readonly reverseMappings: SubstitutionMapping;
    private readonly numberOfMappings: number;
    private readonly fullRotationCompleted: boolean;

    constructor(startingPosition: number, mappings: SubstitutionMapping, numberOfMappings?: number, fullRotationCompleted: boolean = false, currentPosition: number = startingPosition) {    
        // assert starting position within range
        // assert that mapping contains all of the possible positions        

        this.startingPosition = startingPosition;
        this.currentPosition = currentPosition;
        this.mappings = mappings;
        this.numberOfMappings = numberOfMappings ? numberOfMappings : Object.keys(mappings).length;            
        this.reverseMappings = reverseMappings(this.getMappingsAtOffset(mappings, this.numberOfMappings));            
        this.fullRotationCompleted = fullRotationCompleted;
    }    

    move(numberOfPositionsToMove: number = 1): Rotor {
        const newPosition = this.getMappingIndex(this.currentPosition + numberOfPositionsToMove);                

        const fullRotationCompleted = (newPosition === this.startingPosition);

        return new Rotor(this.startingPosition, this.mappings, this.numberOfMappings, fullRotationCompleted, newPosition);
    }

    getSubstitution(position: number) {    
        return this.substitute(this.mappings, position);
    }

    getReverseSubstitution(position: number) {                        
        return this.substitute(this.reverseMappings, position, true);
    }

    hasCompletedFullRotation(): boolean {
        return this.fullRotationCompleted;
    }

    private substitute(mappings: SubstitutionMapping, position: number, reverse: boolean = false) {
        // assert that position < numberOfMappings
        
        const positionIncludingOffset = reverse ? position : this.currentPosition + position;
        const mappingIndex = this.getMappingIndex(positionIncludingOffset); 

        return mappings[mappingIndex];
    }

    private getMappingIndex(position: number): number {
        return position % this.numberOfMappings;            
    }

    // I would bust this out into a generic reusable utility function
    private getMappingsAtOffset(mappings: SubstitutionMapping, numberOfMappings: number): SubstitutionMapping {
        let mappingsAtOffset = [];
        
        for (let i = 0; i < numberOfMappings; i++) {
            mappingsAtOffset.push(this.substitute(mappings, i));    
        }   
        
        return mappingsAtOffset;
    }    
}


class Enigma {
    private readonly rotors: Rotor[]
    private readonly plugboardMapping: SubstitutionMapping
    private readonly reversePlugboardMapping: SubstitutionMapping
    private readonly reflectorMapping: SubstitutionMapping

    constructor(plugboard: SubstitutionMapping, reflector: SubstitutionMapping, rotors: Rotor[]) {
        // assert all mappings have the same number of keys and same keys
        // assert all mappings are unique, ie can't map to the same value twice

        this.plugboardMapping = plugboard;
        this.reversePlugboardMapping = reverseMappings(this.plugboardMapping);        
        this.reflectorMapping = reflector;
        this.rotors = rotors;        
    }

    encrypt(input: number): number {
        // assert the given input exists in the mappings

        // first move the rotors
        this.rotors.forEach((rotor, index, rotors) => {            
            
            // the first rotor always turns, subsequent ones only turn once the preceeding rotor has completed a full rotation
            if (index === 0 || rotors[index - 1].hasCompletedFullRotation()) {                                
                rotors[index] = rotor.move(); 
            }        
        });
        
        // substitute using the plugboard
        let encrypted = this.plugboardMapping[input];        

        // now run through the rotors in order
        encrypted = this.rotors.reduce((value: number, rotor: Rotor) => rotor.getSubstitution(value), encrypted);            

        // reflect back
        encrypted = this.reflectorMapping[encrypted];    

        // now run through the rotors in reverse order
        encrypted = this.rotors.reduceRight((value: number, rotor: Rotor) => rotor.getReverseSubstitution(value), encrypted);        

        // reverse substitute using the plugboard
        encrypted = this.reversePlugboardMapping[encrypted];

        return encrypted;
    }
}


// setup the mapping data, this would come from UI component, could be configured in a UI
const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '];

const rotor1Mapping: SubstitutionMapping = [14, 25, 11, 21, 7, 13, 16, 23, 4, 5, 9, 22, 15, 3, 20, 2, 12, 24, 0, 8, 19, 26, 1, 10, 17, 18, 6];
const rotor2Mapping: SubstitutionMapping = [5, 25, 20, 6, 24, 19, 10, 16, 8, 21, 2, 11, 13, 12, 22, 18, 17, 7, 26, 14, 3, 15, 0, 23, 9, 4, 1];
const plugboardMapping: SubstitutionMapping = [9, 0, 21, 10, 4, 8, 24, 12, 1, 11, 23, 5, 20, 3, 19, 17, 16, 25, 7, 26, 13, 18, 15, 6, 2, 14, 22];
const reflectorMapping: SubstitutionMapping = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14, 17, 16, 19, 18, 21, 20, 23, 22, 25, 24, 26];

const rotor1 = new Rotor(0, rotor1Mapping);
const rotor2 = new Rotor(1, rotor2Mapping);

const enigma = new Enigma(plugboardMapping, reflectorMapping, [rotor1, rotor2]); 


// function to encrypt the given text using the passed in Enigma instance
let encrypt = (chars: string[], enigma: Enigma, text: string): string => {
    let encryptedText: string = '';

    for (const char of text) {
        const charIndex = chars.indexOf(char);    
        const encryptedIndex = enigma.encrypt(charIndex);
        encryptedText += chars[encryptedIndex];         
    }     

    return encryptedText;
};


// take in some text and encrypt it
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question(`Please enter some text to encrypt: `, (text) => {
    console.log(encrypt(chars, enigma, text));
    readline.close();
});









