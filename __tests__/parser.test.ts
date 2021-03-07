import { getDeviceInformations, DeviceInfo } from '../lib';
import { Readable } from 'stream';

const errorPayload = `+IN,Error,860861040012977,2,5,NoBattery,7,ECUFailure,2021-01-14T15:06:18,0036$
AABBAA
+IN,Error,860861040012977,1,7,ECUFailure,2021-01-14T15:09:18,0037$
+IN,Error,860861040012977,1,7,ECUFailure,2021-01-14T15:09:18,0037$`;

const deviceInfoPayload = `
+IN,DeviceInfo,860861040012977,34,5612,2021-01-14T18:30:10,0038$
CCDDEE
+IN,DeviceInfo,860861040012977,86,5600,2021-01-14T15:05:10,0035$
AABBAA`;

const payloadWithErrorAndDeviceInfo =
  `+IN,DeviceInfo,860861040012977,86,5600,2021-01-14T15:05:10,0035$
AABBAA
+IN,Error,860861040012977,2,5,NoBattery,7,ECUFailure,2021-01-14T15:06:18,0036$
+IN,Error,860861040012977,1,7,ECUFailure,2021-01-14T15:09:18,0037$
+IN,DeviceInfo,860861040012977,34,5612,2021-01-14T18:30:10,0038$
CCDDEE
+IN,Error,860861040012977,4,5,NoBattery,7,ECUFailure,8,Reboot,10,IotError,2021-01-14T19:05:10,0039$+IN,DeviceInfo,860861040012977,3,5623,2021-01-14T23:59:10,0040$
FFGGHH`;

describe('Testing getDeviceInformations', function () {
  it('no payload should return nothing', async () => {
    const result = await getDeviceInformations(Readable.from(''));
    expect(result).toStrictEqual([]);
  });

  it('deviceInfo should be returned', async () => {
    const result = await getDeviceInformations(Readable.from(deviceInfoPayload));
    const expected: DeviceInfo[] = [
      {
        "batteryLife": "34 %",
        "imei": "860861040012977",
        "odometerInKms": "5612 km",
        "time": new Date("2021-01-14T17:30:10.000Z")
      },
      {
        "batteryLife": "86 %",
        "imei": "860861040012977",
        "odometerInKms": "5600 km",
        "time": new Date("2021-01-14T14:05:10.000Z")
      }
    ];

    expect(result).toStrictEqual(expected);
  });


  it(`errors should be returned`, async () => {
    const result = await getDeviceInformations(Readable.from(errorPayload));
    const expected: DeviceInfo[] = [
      {
        "imei": "860861040012977",
        "time": new Date("2021-01-14T14:06:18.000Z"),
        "errors": [{
          "code": "5",
          "description": "NoBattery"
        },
        {
          "code": "7",
          "description": "ECUFailure"
        }]
      },
      {
        "imei": "860861040012977",
        "time": new Date("2021-01-14T14:09:18.000Z"),
        "errors": [{
          "code": "7",
          "description": "ECUFailure"
        }]
      },
      {
        "imei": "860861040012977",
        "time": new Date("2021-01-14T14:09:18.000Z"),
        "errors": [{
          "code": "7",
          "description": "ECUFailure"
        }]
      }];
    expect(result).toStrictEqual(expected);
  });

  it(`deviceInfo & errrors should be returned`, async () => {
    const result = await getDeviceInformations(Readable.from(payloadWithErrorAndDeviceInfo));

    const expected: DeviceInfo[] = [{
      "imei": "860861040012977",
      "batteryLife": "86 %",
      "odometerInKms": "5600 km",
      "time": new Date("2021-01-14T14:05:10.000Z")
    },
    {
      "imei": "860861040012977",
      "time": new Date("2021-01-14T14:06:18.000Z"),
      "errors": [{
        "code": "5",
        "description": "NoBattery"
      },
      {
        "code": "7",
        "description": "ECUFailure"
      }]
    },
    {
      "imei": "860861040012977",
      "time": new Date("2021-01-14T14:09:18.000Z"),
      "errors": [{
        "code": "7",
        "description": "ECUFailure"
      }]
    },
    {
      "imei": "860861040012977",
      "batteryLife": "34 %",
      "odometerInKms": "5612 km",
      "time": new Date("2021-01-14T17:30:10.000Z")
    },
    {
      "imei": "860861040012977",
      "time": new Date("2021-01-14T22:59:10.000Z"),
      "errors": [{
        "code": "5",
        "description": "NoBattery"
      },
      {
        "code": "7",
        "description": "ECUFailure"
      },
      {
        "code": "8",
        "description": "Reboot"
      },
      {
        "code": "10",
        "description": "IotError"
      }]
    }];

    expect(result).toStrictEqual(expected);
  });
});
