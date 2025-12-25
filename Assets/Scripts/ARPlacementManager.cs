using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

[RequireComponent(typeof(ARRaycastManager))]
public class ARPlacementManager : MonoBehaviour
{
    [SerializeField]
    private GameObject placementPrefab;

    private GameObject spawnedObject;
    private ARRaycastManager raycastManager;
    private static List<ARRaycastHit> hits = new List<ARRaycastHit>();

    private void Awake()
    {
        raycastManager = GetComponent<ARRaycastManager>();
    }

    private void Update()
    {
        if (Input.touchCount == 0) return;

        Touch touch = Input.GetTouch(0);

        if (touch.phase == TouchPhase.Began)
        {
            if (raycastManager.Raycast(touch.position, hits, TrackableType.PlaneWithinPolygon))
            {
                Pose hitPose = hits[0].pose;

                if (spawnedObject == null)
                {
                    spawnedObject = Instantiate(placementPrefab, hitPose.position, hitPose.rotation);
                }
                else
                {
                    // If already spawned, we might want to move it or just ignore
                    // For this prototype, let's allow moving it if it's the first touch
                    spawnedObject.transform.position = hitPose.position;
                }
            }
        }
    }

    public GameObject GetSpawnedObject() => spawnedObject;
}
