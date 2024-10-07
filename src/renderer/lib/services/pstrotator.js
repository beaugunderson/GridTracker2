/**
 * PSTRotator is a third party application (windows-only) that interfaces with dozens of antenna rotators.
 * It offers a way for other apps to request rotation to a specific azimuth, or a grid square.
 *
 * Other rotator control apps, like [CatRotator](https://www.pianetaradio.it/blog/catrotator/) also support this API.
 *
 * The most comprehensive API details are in this Groups.io post:
 *   https://groups.io/g/PstRotator/message/5825
 *
 */
GT.pstrotatorSettings = {};

function pstrotatorServiceChanged()
{
  GT.pstrotatorSettings.enable = pstrotatorCheckBox.checked;
  GT.pstrotatorSettings.ip = pstrotatorIpInput.value;
  GT.pstrotatorSettings.port = pstrotatorPortInput.value;

  saveLogSettings();
  if (GT.rosterInitialized)
  {
    GT.callRosterWindowHandle.window.setPstrotatorEnable(GT.pstrotatorSettings.enable);
  }
}

function aimRotator(info)
{
  const { callObj } = info

  if (GT.pstrotatorSettings.enable == true && GT.pstrotatorSettings.port > 0 && GT.pstrotatorSettings.ip.length > 4 && callObj.distance > 0)
  {
    // If we have a .grid, we have a .distance and .heading, so just send the heading
    let payload = `<PST><AZIMUTH>${Math.round(callObj.heading)}</AZIMUTH></PST>`;
    
    try
    {
      sendUdpMessage(payload, payload.length, parseInt(GT.pstrotatorSettings.port), GT.pstrotatorSettings.ip);
      if (callObj.DEcall)
      {
        addLastTraffic(`<font style='color:white'>Aiming rotator at ${callObj.DEcall}</font>`);
      }
      else
      {
        addLastTraffic(`<font style='color:white'>Aiming rotator to ${callObj.heading}&deg;</font>`);
      }
    }
    catch (e)
    {
      addLastTraffic("<font style='color:red'>UDP aimRotator failed</font>");
    }
  }
}
