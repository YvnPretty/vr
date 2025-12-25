using UnityEngine;
using System.Collections;
using System;

public class ARViewSharer : MonoBehaviour
{
    [Header("Streaming Settings")]
    public Camera arCamera;
    public float frameRate = 10f;
    public bool isSharing = false;

    private Coroutine sharingCoroutine;

    public void ToggleSharing()
    {
        isSharing = !isSharing;
        if (isSharing)
        {
            sharingCoroutine = StartCoroutine(ShareRoutine());
            Debug.Log("Sharing Started");
        }
        else
        {
            if (sharingCoroutine != null) StopCoroutine(sharingCoroutine);
            Debug.Log("Sharing Stopped");
        }
    }

    private IEnumerator ShareRoutine()
    {
        while (isSharing)
        {
            yield return new WaitForEndOfFrame();
            CaptureAndSend();
            yield return new WaitForSeconds(1f / frameRate);
        }
    }

    private void CaptureAndSend()
    {
        // 1. Capture Camera Frame
        RenderTexture rt = new RenderTexture(Screen.width / 2, Screen.height / 2, 24);
        arCamera.targetTexture = rt;
        Texture2D screenShot = new Texture2D(rt.width, rt.height, TextureFormat.RGB24, false);
        arCamera.Render();
        RenderTexture.active = rt;
        screenShot.ReadPixels(new Rect(0, 0, rt.width, rt.height), 0, 0);
        arCamera.targetTexture = null;
        RenderTexture.active = null;
        Destroy(rt);

        byte[] bytes = screenShot.EncodeToJPG(50); // Compressed for performance
        Destroy(screenShot);

        // 2. Capture Camera Pose
        Vector3 pos = arCamera.transform.position;
        Quaternion rot = arCamera.transform.rotation;

        // 3. Package Data
        ARFrameData data = new ARFrameData
        {
            position = pos,
            rotation = rot,
            imageBuffer = Convert.ToBase64String(bytes),
            timestamp = DateTime.Now.Ticks
        };

        // 4. Send Data
        SendDataToNetwork(data);
    }

    private void SendDataToNetwork(ARFrameData data)
    {
        ARNetworkManager networkManager = FindObjectOfType<ARNetworkManager>();
        if (networkManager != null && networkManager.role == ARNetworkManager.NetworkRole.Sender)
        {
            networkManager.SendFrame(data);
        }
        
        Debug.Log($"[AR Sharing] Sent frame: {data.imageBuffer.Length} characters at {data.position}");
    }

    [Serializable]
    public class ARFrameData
    {
        public Vector3 position;
        public Quaternion rotation;
        public string imageBuffer;
        public long timestamp;
    }
}
