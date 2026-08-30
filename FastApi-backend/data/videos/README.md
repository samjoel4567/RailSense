# TrainSense — Prerecorded Video Directory

This directory is designated for storing prerecorded railway and track camera footage used by the YOLOv8 Vision Detection service.

## Video Requirements for YOLOv8 Vision Demo

Please place your selected prerecorded railway/track video file (e.g., `track_video.mp4`) in this directory (`FastApi-backend/data/videos/`).

The video should preferably meet the following criteria:
- **Clear Railway Track Visibility**: Clear, unobstructed view of railway tracks and right-of-way.
- **Track Intrusion / Obstacles**: Footage showing a person, vehicle, or other potential track intrusion/obstacle.
- **Resolution**: Sufficient resolution (e.g. 720p or 1080p) for reliable YOLO object detection inference.
- **Camera Stability**: Stable, fixed or forward-facing train-mounted camera footage with minimal jitter.
- **Duration**: Several seconds of continuous footage to allow steady real-time object tracking and event generation.
