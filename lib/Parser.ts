import { Readable } from 'stream';


/* Due there are not much types I've avoided to create a types.ts and import/export it through index */
/* added packet interface only to maintain some kind of type to encapsulate a generic message type */
interface Packet extends Pick<DeviceInfo, "imei" | "time" | "errors"> {
  command: 'x',
  type: 'IN' | 'OUT',
  instruction: 'DeviceInfo' | 'Error',
  batteryLvl: number,
  odometer: number
}

export type DeviceInfo = {
  imei: string,
  batteryLife?: string,
  odometerInKms?: string,
  errors?: Error[],
  time: Date
};

type Error = {
  description: string,
  code: string
};

const START_PACKET_CHAR = '+';
const END_PACKET_CHAR = '$';
const SPLIT_PACKET_CHAR = '\n';
const SPLIT_COMMAND_CHAR = ',';

/*
  NOTE: IMHO the best way is to make this function to handle line by line, but cuz the challenge asked to pass all payload to this function
  I've embedded here the logic to read from stream line by line.
*/
export async function getDeviceInformations(payload: Readable): Promise<DeviceInfo[]> {
  const allPayloadString = await streamToString(payload);

  const lines = allPayloadString.split(SPLIT_PACKET_CHAR);
  return lines.filter(line => isPacket(line)).map(line => parsePacket(line));
}

export async function streamToString(payload: Readable): Promise<string> {
  let allPayloadString = '';

  for await (const chunk of payload) {
    allPayloadString += chunk;
  }

  return allPayloadString;
}

const parsePacket = (line: string): DeviceInfo => {
  const packet = line.split(SPLIT_COMMAND_CHAR);
  const packetInstruction = getPacketInstruction(packet);

  if (packetInstruction === 'Error') return getDeviceError(packet);
  else if (packetInstruction === 'DeviceInfo') return getDeviceInformation(packet);
  else throw (new Error(`Unrecognized packet instruction: ${packetInstruction}`));
}

const getDeviceError = (packet: string[]): DeviceInfo => {
  const imei = packet[2];
  const numberOfErrors: number = +packet[3];
  const packetCountNumber = packet.pop();
  const time = new Date(packet.pop()!);
  const errors: Error[] = [];

  for (let i = 4; errors.length < numberOfErrors; i = i + 2) {
    errors.push({
      code: packet[i],
      description: packet[i + 1]
    });
  }

  return { imei, time, errors };
}

const getDeviceInformation = (packet: string[]): DeviceInfo => {
  return { imei: packet[2], batteryLife: `${packet[3]} %`, odometerInKms: `${packet[4]} km`, time: new Date(packet[5]) };
}

const getPacketInstruction = (packet: string[]): Packet["instruction"] => {
  return packet[1] as Packet["instruction"];
}

/*
  Tells if the streamed line has command syntax or not
  POSSIBLE IMPROVEMENTS:
  - Control garbage packets that doesn't contains correct structure with all required fields (log them and skip if can't be processed)
  - Remove possible patters not recognized by parser like \n\n or \s+..
*/
const isPacket = (line: string): boolean => {
  const cleanLine = line.replace(/\s+/, '');
  return cleanLine.startsWith(START_PACKET_CHAR) && line.endsWith(END_PACKET_CHAR);
}
