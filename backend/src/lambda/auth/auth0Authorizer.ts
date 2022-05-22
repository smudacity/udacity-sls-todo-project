import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify} from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'
import {jwksUrl} from '../../../config'

/*const cert = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIJDmAhZsgTUjNoMA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNV
BAMTF3NtLXJzYS1kZXYuZXUuYXV0aDAuY29tMB4XDTIyMDUxOTA5NTgwMloXDTM2
MDEyNjA5NTgwMlowIjEgMB4GA1UEAxMXc20tcnNhLWRldi5ldS5hdXRoMC5jb20w
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDmNtp17h1YlwHaIpHHgeeE
eFb3z3kl8mlwvweRhjwN4aApTfaNdD0drTh9HTR+eFkL/K7TuNY7P9H5MB/pZ1q8
RQshDpvoKtkqPFLNa90vOWwSGz62wV8Sme4mjSyvcT8ykWmwFArdki1yL5HaK+vC
ICXbCBgUauCkvvMHHfSPQergRUhcP4873rtoYJQG/5WXZl/a8CpC5bQ8Ttzb1meG
7jnXYE/hbMqIubxficstGhyUXPXH7HK37T5QDs5cP5GLvkhQsYIGzPUpt1i6IpeN
Gs2lAXg2Rp5AAKUooB+sI2gTeXHTlURd6sPpXZ8K8uSUy63BFqLLYlix9oT/KT1h
AgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFI09iln9iDh9BHqv
/khPB14P8gi1MA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEAEd9o
gAVPS5NCmNJ1HcTNJOMLy9npo2KH6elSReeZDbkbxY9HI9auLm3mhQNNf6QeUjqq
36R6dJ11o9l7A7mKnHQYAQn36W+U8xVIIpB6Acr6FiGWQ73GXYB6B5nEjRpRfY+c
3h1xfFaqIF1FYh2L+KBI2ROmfefJoz5HrfPNC/Hw0Z1s1rUnHN+g5w89hnkuzua+
zQ9e682gOEAGTuxCDg5DUPczU1Wb1Uj/MC6H2VUwAr/i0DzJqbPoVrSixP0ZFyeD
6zEOROkS0SHMmmAXPHwDM/zwQdghrd53b5axzOn/sIh1bpNBa/R0quU//y9QUWhJ
O0cRoFI2icqzeC1hjw==
-----END CERTIFICATE-----`
*/
const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// TODO: Shruthi: work on getting cert at runtime
//const jwksUrl = jwksUrl;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
 // const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const cert = await getJwtCertificate(jwksUrl)
  const payload = verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload// IF not verified successfully, it throws an exception
  return payload

}

async function getJwtCertificate(url: string): Promise<string> {
  let cert: string
  try {
    const response = await Axios.get(url)
    const pem = response.data['keys'][0]['x5c'][0]
    cert = `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----`;
    logger.info(`Cert is framed : ${cert}`)
  } catch (e) {
    logger.error('Unable to retrieve certificate', { error: e.message })
  }
  return cert
}


function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
