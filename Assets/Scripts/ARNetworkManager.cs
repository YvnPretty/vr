using UnityEngine;
using System;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.IO;

public class ARNetworkManager : MonoBehaviour
{
    public enum NetworkRole { Sender, Receiver }
    public NetworkRole role;
    public string targetIp = "127.0.0.1";
    public int port = 11000;

    private TcpClient client;
    private TcpListener listener;
    private Thread networkThread;
    private bool isRunning = false;

    [SerializeField] private ARViewSharer sharer;
    [SerializeField] private ARViewReceiver receiver;

    private void Start()
    {
        isRunning = true;
        if (role == NetworkRole.Sender)
        {
            networkThread = new Thread(SenderLoop);
        }
        else
        {
            networkThread = new Thread(ReceiverLoop);
        }
        networkThread.Start();
    }

    private void OnDestroy()
    {
        isRunning = false;
        client?.Close();
        listener?.Stop();
        networkThread?.Abort();
    }

    private void SenderLoop()
    {
        while (isRunning)
        {
            try
            {
                if (client == null || !client.Connected)
                {
                    client = new TcpClient();
                    client.Connect(targetIp, port);
                }

                if (sharer.isSharing)
                {
                    // This is a simplified logic. In a real app, we'd use a thread-safe queue.
                    // For the prototype, we'll let the Sharer call a Send method.
                }
                Thread.Sleep(100);
            }
            catch (Exception e)
            {
                Debug.LogWarning("Network Sender Error: " + e.Message);
                Thread.Sleep(2000);
            }
        }
    }

    public void SendFrame(ARViewSharer.ARFrameData data)
    {
        if (client == null || !client.Connected) return;

        try
        {
            NetworkStream stream = client.GetStream();
            string json = JsonUtility.ToJson(data);
            byte[] jsonBytes = System.Text.Encoding.UTF8.GetBytes(json);
            byte[] lengthPrefix = BitConverter.GetBytes(jsonBytes.Length);

            stream.Write(lengthPrefix, 0, 4);
            stream.Write(jsonBytes, 0, jsonBytes.Length);
        }
        catch (Exception e)
        {
            Debug.LogError("Send Error: " + e.Message);
        }
    }

    private void ReceiverLoop()
    {
        listener = new TcpListener(IPAddress.Any, port);
        listener.Start();

        while (isRunning)
        {
            try
            {
                using (TcpClient remoteClient = listener.AcceptTcpClient())
                using (NetworkStream stream = remoteClient.GetStream())
                {
                    while (isRunning && remoteClient.Connected)
                    {
                        byte[] lengthPrefix = new byte[4];
                        if (stream.Read(lengthPrefix, 0, 4) < 4) break;
                        int length = BitConverter.ToInt32(lengthPrefix, 0);

                        byte[] buffer = new byte[length];
                        int bytesRead = 0;
                        while (bytesRead < length)
                        {
                            bytesRead += stream.Read(buffer, bytesRead, length - bytesRead);
                        }

                        string json = System.Text.Encoding.UTF8.GetString(buffer);
                        var data = JsonUtility.FromJson<ARViewSharer.ARFrameData>(json);
                        
                        // Dispatch to main thread
                        UnityMainThreadDispatcher.Instance().Enqueue(() => {
                            receiver.OnFrameReceived(data);
                        });
                    }
                }
            }
            catch (Exception e)
            {
                if (isRunning) Debug.LogWarning("Network Receiver Error: " + e.Message);
            }
        }
    }
}
