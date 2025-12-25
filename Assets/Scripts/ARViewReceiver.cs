using UnityEngine;
using UnityEngine.UI;

public class ARViewReceiver : MonoBehaviour
{
    [SerializeField] private RawImage displayImage;
    [SerializeField] private Transform remoteCameraTransform;

    private Texture2D receivedTexture;

    private void Start()
    {
        receivedTexture = new Texture2D(2, 2);
        displayImage.texture = receivedTexture;
    }

    // This would be called by your networking event system
    public void OnFrameReceived(ARViewSharer.ARFrameData data)
    {
        // 1. Update Camera Pose
        remoteCameraTransform.position = data.position;
        remoteCameraTransform.rotation = data.rotation;

        // 2. Update Image
        byte[] imageBytes = Convert.FromBase64String(data.imageBuffer);
        receivedTexture.LoadImage(imageBytes);
        receivedTexture.Apply();
    }
}
